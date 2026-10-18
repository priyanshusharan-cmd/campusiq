import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function load(file, deps = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: name => { if (!(name in deps)) throw new Error(name); return deps[name]; }, Date, Error, Set });
  return exports;
}
const actions = load('src/features/ai/services/actionDraft.ts');
const draft = values => actions.parseActionDraft(JSON.stringify(values));
let ids = 0;
const id = () => `new-${++ids}`;
const snapshot = () => ({ subjects: [], semesters: [], entries: [], gradeEntries: [], assignments: [], exams: [], records: [], gradeScheme: { name: 'Test', boundaries: [{ minMarks: 80, maxMarks: 100, gradeLetter: 'A', gradePoints: 9 }, { minMarks: 60, maxMarks: 79.99, gradeLetter: 'B', gradePoints: 8 }, { minMarks: 0, maxMarks: 59.99, gradeLetter: 'F', gradePoints: 0 }] } });
const subject = (name = 'Math', credits = 3) => ({ name, code: name, credits, type: 'theory' });
const lesson = (name = 'Math', start = '09:00', end = '10:00') => ({ subject: name, day: 0, start, end, room: '403', type: 'lecture' });

test('plans timetable plus subjects without mutating app data, then skips duplicate imports', () => {
  const before = snapshot(); const original = JSON.stringify(before);
  const request = draft({ subjects: [subject()], classes: [lesson()] });
  const plan = actions.planAcademicActions(request, before, 4, id);
  assert.equal(JSON.stringify(before), original);
  assert.equal(plan.subjects[0].semesterId, '4');
  assert.equal(plan.entries[0].subjectId, plan.subjects[0].id);
  const repeat = actions.planAcademicActions(request, plan, 4, id);
  assert.equal(repeat.subjects.length, 1); assert.equal(repeat.entries.length, 1);
});
test('conflicts block the whole plan; explicit replacement preserves dated classes and other semesters', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson()] }), snapshot(), 4, id);
  base.entries.push({ ...base.entries[0], id: 'dated', date: '2026-10-20' });
  const original = JSON.stringify(base);
  const request = draft({ subjects: [subject('Physics')], classes: [lesson('Physics', '09:30', '10:30')] });
  assert.throws(() => actions.planAcademicActions(request, base, 4, id), /overlaps/);
  assert.equal(JSON.stringify(base), original);
  const replaced = actions.planAcademicActions(request, base, 4, id, true);
  assert.equal(replaced.entries.length, 2);
  assert.ok(replaced.entries.some(e => e.id === 'dated'));
});
test('marksheet results update real scorecard rows and calculate weighted SGPA while retaining other results', () => {
  const request = draft({ semester: 3, subjects: [subject('Math', 3), subject('Physics', 1)], results: [{ subject: 'Math', credits: 3, marks: 170, maxMarks: 200 }, { subject: 'Physics', credits: 1, gradePoint: 8 }] });
  const first = actions.planAcademicActions(request, snapshot(), 3, id);
  assert.equal(first.calculatedSgpa, 8.75);
  assert.equal(first.semesters[0].sgpaSubjects[0].totalMarks, '85');
  assert.equal(first.semesters[0].totalCredits, 4);
  const again = actions.planAcademicActions(draft({ results: [{ subject: 'Math', credits: 3, gradePoint: 10 }] }), first, 3, id);
  assert.equal(again.semesters[0].sgpaSubjects.length, 2);
  assert.equal(again.calculatedSgpa, 9.5);
  assert.equal(again.subjects.length, 2);
});
test('unreadable credits and grade points block saving; a reported SGPA alone is not a fabricated result', () => {
  assert.throws(() => actions.planAcademicActions(draft({ subjects: [subject('Math', null)], results: [{ subject: 'Math', gradePoint: 9 }] }), snapshot(), 1, id), /Enter credits/);
  assert.throws(() => actions.planAcademicActions(draft({ subjects: [subject()], results: [{ subject: 'Math', marks: 80 }] }), snapshot(), 1, id), /maximum marks/);
  assert.throws(() => actions.planAcademicActions(draft({ subjects: [subject()], results: [{ subject: 'Math', grade: 'unknown' }] }), snapshot(), 1, id), /grade point/);
  assert.throws(() => actions.planAcademicActions(draft({ reportedSgpa: 9 }), snapshot(), 1, id), /total semester credits/);
});
test('assignments, exams and attendance may be proposed together and are idempotent', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson()] }), snapshot(), 4, id);
  const request = draft({ assignments: [{ subject: 'Math', title: 'Problem set', date: '2026-10-20' }], exams: [{ subject: 'Math', date: '2026-10-22', type: 'quiz', start: '10:00' }], attendance: [{ subject: 'Math', date: '2026-10-19', start: '09:00', status: 'absent' }] });
  const plan = actions.planAcademicActions(request, base, 4, id);
  assert.equal(plan.assignments.length, 1); assert.equal(plan.exams.length, 1); assert.equal(plan.records.length, 1);
  assert.equal(plan.records[0].timetableEntryId, base.entries[0].id);
  const again = actions.planAcademicActions(request, plan, 4, id);
  assert.equal(again.assignments.length, 1); assert.equal(again.exams.length, 1); assert.equal(again.records.length, 1);
});
test('missing and ambiguous subjects, invalid dates, and unsupported values never pass validation', () => {
  assert.throws(() => actions.parseActionDraft('{"attendance":[{"status":"whatever"}]}'), /Unsupported/);
  assert.throws(() => actions.parseActionDraft('{"classes":[{"day":9}]}'), /Invalid number/);
  assert.throws(() => actions.planAcademicActions(draft({ subjects: [subject()], assignments: [{ subject: 'Math', title: 'Test', date: '2026-02-30' }] }), snapshot(), 1, id), /valid.*date/);
  assert.throws(() => actions.planAcademicActions(draft({ subjects: [subject()], exams: [{ subject: 'Math', date: '2026-99-99' }] }), snapshot(), 1, id), /valid date/);
  assert.throws(() => actions.planAcademicActions(draft({ classes: [lesson()] }), snapshot(), 1, id), /Add or select/);
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson(), lesson('Math', '11:00', '12:00')] }), snapshot(), 1, id);
  assert.throws(() => actions.planAcademicActions(draft({ attendance: [{ subject: 'Math', date: '2026-10-19', status: 'present' }] }), base, 1, id), /Choose one scheduled/);
});
test('semester matching prevents imports from linking to a subject in a different semester', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()] }), snapshot(), 1, id);
  const plan = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson()] }), base, 2, id);
  assert.equal(plan.subjects.length, 2);
  assert.equal(plan.entries[0].subjectId, plan.subjects[1].id);
});
test('subject updates preserve IDs and unrelated fields', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()] }), snapshot(), 1, id);
  base.subjects[0].faculty = 'Teacher';
  const plan = actions.planAcademicActions(draft({ subjects: [{ name: 'Mathematics', code: 'Math', credits: 4 }] }), base, 1, id);
  assert.equal(plan.subjects.length, 1); assert.equal(plan.subjects[0].id, base.subjects[0].id);
  assert.equal(plan.subjects[0].credits, 4); assert.equal(plan.subjects[0].faculty, 'Teacher');
});

test('subjects and faculty can be saved first, then weekly slots reuse those subjects and preserve faculty', () => {
  const first = actions.planAcademicActions(draft({ subjects: [{ name: 'Mathematics', code: 'MA101', type: 'theory', faculty: 'Dr Rao', credits: null }] }), snapshot(), 2, id);
  assert.equal(first.subjects.length, 1);
  assert.equal(first.subjects[0].faculty, 'Dr Rao');
  assert.equal(first.entries.length, 0);
  const later = draft({ subjects: [{ name: 'Mathematics', code: 'MA101' }], classes: [lesson('MA101')] });
  const scheduled = actions.planAcademicActions(later, first, 2, id);
  assert.equal(scheduled.subjects.length, 1);
  assert.equal(scheduled.subjects[0].faculty, 'Dr Rao');
  assert.equal(scheduled.entries[0].subjectId, first.subjects[0].id);
  const updated = actions.planAcademicActions(draft({ subjects: [{ name: 'Mathematics', code: 'MA101', faculty: 'Prof Sen' }] }), scheduled, 2, id);
  assert.equal(updated.subjects[0].faculty, 'Prof Sen');
  assert.equal(updated.subjects[0].id, first.subjects[0].id);
});
test('review does not write stores; confirmed plans write app stores and roll back synchronous failures', () => {
  let data = snapshot(); let writes = 0; let failOnce = false;
  const store = (prop, method) => ({ getState: () => ({ [prop]: data[prop], [method]: value => { if (failOnce) { failOnce = false; throw new Error('disk'); } writes++; data = { ...data, [prop]: value }; } }) });
  const deps = {
    './actionDraft': actions, '@/types': { generateId: id },
    '@/stores/useProfileStore': { useProfileStore: { getState: () => ({ profile: data.profile ?? { currentSemester: 1 } }), setState: value => { data = { ...data, ...value }; } } },
    '@/stores/useSettingsStore': { useSettingsStore: { getState: () => data.preferences ?? {}, setState: preferences => { data = { ...data, preferences }; } } },
    '@/stores/useSubjectStore': { useSubjectStore: store('subjects', 'loadSubjects') },
    '@/stores/useTimetableStore': { useTimetableStore: { ...store('entries', 'loadEntries'), getState: () => ({ ...store('entries', 'loadEntries').getState(), events: data.events }), setState: value => { data = { ...data, ...value }; } } },
    '@/stores/useAssignmentStore': { useAssignmentStore: store('assignments', 'loadAssignments') },
    '@/stores/useExamStore': { useExamStore: store('exams', 'loadExams') },
    '@/stores/useAttendanceStore': { useAttendanceStore: store('records', 'loadRecords') },
    '@/stores/useAcademicStore': { useAcademicStore: { getState: () => ({ ...data, loadSemesters: value => { writes++; data = { ...data, semesters: value }; }, loadGradeEntries: value => { writes++; data = { ...data, gradeEntries: value }; } }) } },
  };
  const adapter = load('src/features/ai/services/applyAcademicActions.ts', deps);
  const request = draft({ subjects: [subject()], classes: [lesson()] });
  adapter.previewAcademicActions(request, 1, false); assert.equal(writes, 0);
  adapter.applyAcademicActions(request, 1, false); assert.ok(writes > 0); assert.equal(data.entries.length, 1);
  const before = JSON.stringify(data); failOnce = true;
  assert.throws(() => adapter.applyAcademicActions(draft({ subjects: [subject('Physics')] }), 1, false), /disk/);
  assert.equal(JSON.stringify(data), before);
  const preview = adapter.previewAcademicActions(request, 1, false);
  const writesBefore = writes;
  data = { ...data, events: { '2026-10-19': 'holiday' } };
  assert.throws(() => adapter.applyAcademicActions(request, 1, false, preview.snapshotSignature), /changed while this review/);
  assert.equal(writes, writesBefore);
  const saved = draft({ changes: [change('settings', '', 'attendanceTarget', '80'), change('profile', '', 'currentSemester', '2'), change('calendar', '2026-10-20', 'type', 'exam')] });
  adapter.applyAcademicActions(saved, 1, false);
  assert.equal(data.preferences.attendanceTarget, 80);
  assert.equal(data.profile.currentSemester, 2);
  assert.equal(data.events['2026-10-20'], 'exam');
});
test('natural language actions cover text beyond timetable imports', () => {
  for (const text of ['Add a math assignment due tomorrow', 'Update my semester grades', 'Mark me absent today', 'Create my exam schedule', 'I was absent for math', 'Save this to my app']) assert.equal(actions.isActionRequest(text), true);
  assert.equal(actions.isActionRequest('Hello'), false);
});

test('printed semester totals can update a manual scorecard without fabricating subject grades', () => {
  const plan = actions.planAcademicActions(draft({ reportedSgpa: 8.8, reportedCredits: 20 }), snapshot(), 2, id);
  assert.equal(plan.semesters[0].sgpa, 8.8); assert.equal(plan.semesters[0].totalCredits, 20);
  assert.equal(plan.gradeEntries.length, 0); assert.equal(plan.subjects.length, 0);
});

test('saved imported results are available to subsequent academic questions', () => {
  const plan = actions.planAcademicActions(draft({ subjects: [subject()], results: [{ subject: 'Math', credits: 3, marks: 90, maxMarks: 100 }] }), { ...snapshot(), currentSemester: 4 }, 4, id);
  const context = load('src/features/ai/services/contextBuilder.ts', {
    '@/stores/useAcademicStore': { useAcademicStore: { getState: () => ({ ...plan, getCGPA: () => 9 }) } },
    '@/stores/useAttendanceStore': { useAttendanceStore: { getState: () => ({ records: [] }) } },
    '@/stores/useSubjectStore': { useSubjectStore: { getState: () => ({ subjects: plan.subjects }) } },
    '@/stores/useProfileStore': { useProfileStore: { getState: () => ({ profile: { currentSemester: 4 } }) } },
  }).buildAcademicContext();
  assert.equal(context.currentSemester, 'Semester 4');
  assert.equal(context.subjects[0].gradePoint, 9); assert.equal(context.subjects[0].marksPercent, 90);
});

test('month attendance expands actual classes, skips holidays, dated extras on other dates and semester bounds', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson(), lesson('Math', '11:00', '12:00')] }), snapshot(), 2, id);
  base.events = { '2026-10-12': 'holiday' };
  base.semesterStartDate = '2026-10-05'; base.semesterEndDate = '2026-10-25';
  base.entries.push({ ...base.entries[0], id: 'extra', date: '2026-11-02' });
  const original = JSON.stringify(base);
  const range = { subject: 'Math', from: '2026-10-01', to: '2026-10-31', status: 'absent' };
  const plan = actions.planAcademicActions(draft({ attendanceRanges: [range] }), base, 2, id);
  assert.equal(JSON.stringify(base), original);
  assert.equal(plan.records.length, 4);
  assert.deepEqual(Array.from(new Set(plan.records.map(r => r.date))), ['2026-10-05', '2026-10-19']);
  assert.ok(plan.records.every(r => r.status === 'absent' && r.timetableEntryId !== 'extra'));
  const again = actions.planAcademicActions(draft({ attendanceRanges: [range] }), plan, 2, id);
  assert.equal(again.records.length, 4);
  const cleared = actions.planAcademicActions(draft({ attendanceRanges: [{ ...range, status: 'unmarked', start: '09:00' }] }), again, 2, id);
  assert.equal(cleared.records.length, 2);
  assert.ok(cleared.records.every(r => r.timetableEntryId === base.entries[1].id));
});

test('a whole day can mark multiple classes and subjects present, absent or cancelled', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject(), subject('Physics')], classes: [lesson(), lesson('Physics', '10:00', '11:00')] }), snapshot(), 1, id);
  for (const status of ['present', 'absent', 'cancelled']) {
    const plan = actions.planAcademicActions(draft({ attendanceRanges: [{ from: '2026-10-19', to: '2026-10-19', status }] }), base, 1, id);
    assert.equal(plan.records.length, 2);
    assert.ok(plan.records.every(r => r.status === status));
  }
});

test('ranges reject invalid, empty or oversized requests and ambiguous legacy records without mutation', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson(), lesson('Math', '11:00', '12:00')] }), snapshot(), 1, id);
  const range = { subject: 'Math', from: '2026-10-19', to: '2026-10-19', status: 'present' };
  for (const overrides of [{ from: '2026-02-30' }, { to: '2026-10-18' }, { to: '2028-10-19' }, { subject: 'Unknown' }, { from: '2026-10-18', to: '2026-10-18' }]) {
    assert.throws(() => actions.planAcademicActions(draft({ attendanceRanges: [{ ...range, ...overrides }] }), base, 1, id));
  }
  base.records.push({ id: 'legacy', subjectId: base.subjects[0].id, date: range.from, status: 'absent' });
  const before = JSON.stringify(base);
  assert.throws(() => actions.planAcademicActions(draft({ attendanceRanges: [range] }), base, 1, id), /legacy/);
  assert.equal(JSON.stringify(base), before);
});

const change = (target, item, field, value, operation = 'update') => ({ target, id: item, operation, field, value });
test('rescheduling existing weekly classes preserves IDs and blocks collisions and other-semester edits', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson(), lesson('Math', '11:00', '12:00')] }), snapshot(), 2, id);
  const entry = base.entries[0]; const before = JSON.stringify(base);
  const plan = actions.planAcademicActions(draft({ changes: [change('class', entry.id, 'startTime', '10:00'), change('class', entry.id, 'endTime', '11:00'), change('class', entry.id, 'room', '301')] }), base, 2, id);
  assert.equal(plan.entries.length, 2); assert.equal(plan.entries[0].id, entry.id);
  assert.equal(plan.entries[0].startTime, '10:00'); assert.equal(plan.entries[0].room, '301');
  assert.equal(JSON.stringify(base), before);
  assert.throws(() => actions.planAcademicActions(draft({ changes: [change('class', entry.id, 'endTime', '11:30')] }), base, 2, id), /overlaps/);
  assert.throws(() => actions.planAcademicActions(draft({ changes: [change('class', entry.id, 'room', '301')] }), base, 1, id), /another semester/);
  assert.throws(() => actions.planAcademicActions(draft({ changes: [change('class', 'invented', 'room', '301')] }), base, 2, id), /no longer exists/);
});

test('one occurrence can be cancelled and rescheduled as a dated class without moving the weekly schedule', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson()] }), snapshot(), 1, id);
  const plan = actions.planAcademicActions(draft({
    classes: [{ ...lesson('Math', '13:00', '14:00'), date: '2026-10-20' }],
    attendanceRanges: [{ subject: 'Math', from: '2026-10-19', to: '2026-10-19', start: '09:00', status: 'cancelled' }],
  }), base, 1, id);
  assert.equal(plan.entries.length, 2); assert.equal(plan.entries[0].date, undefined);
  assert.equal(plan.entries[1].date, '2026-10-20'); assert.equal(plan.entries[1].dayOfWeek, 1);
  assert.equal(plan.records[0].timetableEntryId, base.entries[0].id); assert.equal(plan.records[0].status, 'cancelled');
});

test('tasks and exams can be edited, completed, reopened and deleted without duplicate creation', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], assignments: [{ subject: 'Math', title: 'Homework', date: '2026-10-20' }], exams: [{ subject: 'Math', date: '2026-10-22', type: 'quiz' }] }), snapshot(), 1, id);
  const task = base.assignments[0].id; const exam = base.exams[0].id;
  const plan = actions.planAcademicActions(draft({ changes: [change('assignment', task, 'status', 'completed'), change('assignment', task, 'priority', 'high'), change('exam', exam, 'date', '2026-10-24')] }), base, 1, id);
  assert.equal(plan.assignments[0].status, 'completed'); assert.ok(plan.assignments[0].completedAt);
  assert.equal(plan.assignments[0].priority, 'high'); assert.equal(plan.exams[0].date, '2026-10-24');
  const reopened = actions.planAcademicActions(draft({ changes: [change('assignment', task, 'status', 'pending')] }), plan, 1, id);
  assert.equal(reopened.assignments[0].completedAt, undefined);
  const removed = actions.planAcademicActions(draft({ changes: [change('assignment', task, '', '', 'delete'), change('exam', exam, '', '', 'delete')] }), reopened, 1, id);
  assert.equal(removed.assignments.length, 0); assert.equal(removed.exams.length, 0);
});

test('subject deletion previews dependent data removal and refuses to silently discard results', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson()] }), snapshot(), 1, id);
  const plan = actions.planAcademicActions(draft({ changes: [change('subject', base.subjects[0].id, '', '', 'delete')] }), base, 1, id);
  assert.equal(plan.subjects.length, 0); assert.equal(plan.entries.length, 0);
  assert.ok(plan.summary.some(s => s.includes('1 classes')));
  base.gradeEntries.push({ subjectId: base.subjects[0].id });
  assert.throws(() => actions.planAcademicActions(draft({ changes: [change('subject', base.subjects[0].id, '', '', 'delete')] }), base, 1, id), /has results/);
});

test('profile, calendar and preference edits validate domains and block credentials or arbitrary fields', () => {
  const base = { ...snapshot(), profile: { id: 'profile', name: 'Student', currentSemester: 1 }, preferences: { theme: 'system', attendanceTarget: 75 }, events: {} };
  const original = JSON.stringify(base);
  const plan = actions.planAcademicActions(draft({ changes: [change('profile', '', 'currentSemester', '3'), change('settings', '', 'attendanceTarget', '80'), change('settings', '', 'theme', 'dark'), change('calendar', '2026-10-19', 'type', 'holiday')] }), base, 1, id);
  assert.equal(plan.profile.currentSemester, 3); assert.equal(plan.preferences.attendanceTarget, 80);
  assert.equal(plan.preferences.theme, 'dark'); assert.equal(plan.events['2026-10-19'], 'holiday');
  assert.equal(JSON.stringify(base), original);
  for (const bad of [change('settings', '', 'macOllamaUrl', 'https://evil.example'), change('settings', '', '__proto__', 'x'), change('profile', '', 'id', 'x'), change('settings', '', 'attendanceTarget', '101'), change('settings', '', 'theme', 'unknown'), change('calendar', '2026-02-30', 'type', 'holiday')]) {
    assert.throws(() => actions.planAcademicActions(draft({ changes: [bad] }), base, 1, id));
  }
});

test('calendar holidays change explicit attendance and clearing the event preserves history', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson()], attendance: [{ subject: 'Math', date: '2026-10-19', status: 'present' }] }), snapshot(), 1, id);
  const holiday = actions.planAcademicActions(draft({ changes: [change('calendar', '2026-10-19', 'type', 'holiday')] }), base, 1, id);
  assert.equal(holiday.records.length, 1); assert.equal(holiday.records[0].status, 'holiday');
  const cleared = actions.planAcademicActions(draft({ changes: [change('calendar', '2026-10-19', '', '', 'delete')] }), holiday, 1, id);
  assert.equal(cleared.events['2026-10-19'], undefined); assert.equal(cleared.records[0].status, 'holiday');
});

test('attendance counts remain separate for multiple classes on one day', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson(), lesson('Math', '11:00', '12:00')] }), snapshot(), 1, id);
  const plan = actions.planAcademicActions(draft({ attendanceRanges: [{ subject: 'Math', from: '2026-10-19', to: '2026-10-19', status: 'present' }, { subject: 'Math', from: '2026-10-19', to: '2026-10-19', start: '11:00', status: 'cancelled' }] }), base, 1, id);
  assert.equal(plan.records.length, 2);
  assert.equal(plan.records.find(r => r.timetableEntryId === base.entries[0].id).status, 'present');
  assert.equal(plan.records.find(r => r.timetableEntryId === base.entries[1].id).status, 'cancelled');
});

test('complete subject form details and wrapped long titles survive extraction, planning and reimport', () => {
  const name = 'Artificial Intelligence and Machine Learning: Principles, Methods and Applications';
  const details = { name, code: '001-CS-AI-204', faculty: 'Prof Rahi', credits: 4, type: 'lab', description: 'Theory and practical sessions', room: 'Lab 201', shortName: 'AIML', color: '#123ABC', icon: 'hardware-chip' };
  const request = draft({ subjects: [details] });
  const plan = actions.planAcademicActions(request, snapshot(), 2, id);
  for (const field of Object.keys(details)) assert.equal(plan.subjects[0][field], details[field]);
  const repeat = actions.planAcademicActions(draft({ subjects: [{ name: 'Artificial', code: details.code }] }), plan, 2, id);
  assert.equal(repeat.subjects.length, 1);
  assert.equal(repeat.subjects[0].name, name);
  assert.equal(repeat.subjects[0].type, 'lab');
  assert.equal(repeat.subjects[0].description, details.description);
  const shortenedCode = actions.planAcademicActions(draft({ subjects: [{ name, code: '001-CS' }] }), repeat, 2, id);
  assert.equal(shortenedCode.subjects[0].code, details.code);
});

test('course names longer than a narrow field can be used as class references without shortening', () => {
  const name = 'Advanced Artificial Intelligence and Machine Learning with Data Exploration, Mathematical Foundations, Practical Applications and Research Methods '.repeat(2).trim();
  const plan = actions.planAcademicActions(draft({ subjects: [{ name, code: 'AI-001', type: 'theory' }], classes: [lesson(name)] }), snapshot(), 1, id);
  assert.equal(plan.subjects[0].name, name);
  assert.equal(plan.entries[0].subjectId, plan.subjects[0].id);
});

test('assignment priorities, exam syllabus, attendance notes and class details are saved and updated without duplicates', () => {
  const request = draft({ subjects: [subject()], classes: [{ ...lesson(), room: 'Lab 3', color: '#123456', type: 'lab' }], assignments: [{ subject: 'Math', title: 'Homework', date: '2026-10-20', priority: 'high', notes: 'Chapter 4' }], exams: [{ subject: 'Math', date: '2026-10-22', syllabus: 'Units 1–3', notes: 'Bring ID', type: 'quiz' }], attendance: [{ subject: 'Math', date: '2026-10-19', status: 'absent', note: 'Medical leave' }] });
  const base = actions.planAcademicActions(request, snapshot(), 1, id);
  assert.equal(base.assignments[0].priority, 'high');
  assert.equal(base.exams[0].syllabus, 'Units 1–3'); assert.equal(base.exams[0].notes, 'Bring ID');
  assert.equal(base.records[0].note, 'Medical leave'); assert.equal(base.entries[0].color, '#123456');
  const updated = actions.planAcademicActions(draft({ classes: [{ ...lesson(), room: 'Lab 4', type: '' }], assignments: [{ subject: 'Math', title: 'Homework', date: '2026-10-20', notes: 'Chapter 5' }], exams: [{ subject: 'Math', date: '2026-10-22', syllabus: 'Units 1–4', type: 'quiz' }] }), base, 1, id);
  assert.equal(updated.entries.length, 1); assert.equal(updated.entries[0].room, 'Lab 4'); assert.equal(updated.entries[0].type, 'lab');
  assert.equal(updated.assignments.length, 1); assert.equal(updated.assignments[0].priority, 'high'); assert.equal(updated.assignments[0].notes, 'Chapter 5');
  assert.equal(updated.exams.length, 1); assert.equal(updated.exams[0].syllabus, 'Units 1–4'); assert.equal(updated.exams[0].notes, 'Bring ID');
});

test('duplicate subject field edits become one named card with a real saved ID and preserve omitted details', () => {
  const base = actions.planAcademicActions(draft({ subjects: [{ name: 'Object Oriented Modelling', code: 'CS501', faculty: 'Old faculty', credits: 4, type: 'theory', color: '#123456' }] }), snapshot(), 5, id);
  const saved = base.subjects[0];
  const request = draft({ subjects: [{ name: saved.name, faculty: 'Deepa S.' }], changes: [change('subject', saved.id, 'name', saved.name), change('subject', saved.id, 'faculty', 'Deepa S.')] });
  const original = JSON.stringify(request);
  const normalized = actions.normalizeSubjectActions(request, base, 5);
  assert.equal(normalized.subjects.length, 1); assert.equal(normalized.changes.length, 0);
  assert.equal(normalized.subjects[0].id, saved.id);
  assert.equal(normalized.subjects[0].code, 'CS501'); assert.equal(normalized.subjects[0].credits, 4);
  assert.equal(normalized.subjects[0].type, 'theory'); assert.equal(normalized.subjects[0].color, '#123456');
  const plan = actions.planAcademicActions(normalized, base, 5, id);
  assert.equal(plan.subjects.length, 1); assert.equal(plan.subjects[0].faculty, 'Deepa S.');
  assert.equal(JSON.stringify(request), original);
});

test('faculty updates stay attached to their exact courses and resolve unique names or codes without guessing IDs', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject('Object Oriented Modelling'), subject('Data Exploration')] }), snapshot(), 5, id);
  const request = draft({ changes: [change('subject', 'Object Oriented Modelling', 'faculty', 'Deepa S.'), change('subject', 'Data Exploration', 'faculty', 'Prof. Pradhan')] });
  const plan = actions.planAcademicActions(request, base, 5, id);
  assert.equal(plan.subjects.length, 2);
  assert.equal(plan.subjects.find(s => s.name === 'Object Oriented Modelling').faculty, 'Deepa S.');
  assert.equal(plan.subjects.find(s => s.name === 'Data Exploration').faculty, 'Prof. Pradhan');
  assert.throws(() => actions.planAcademicActions(draft({ changes: [change('subject', 'invented-subject-1', 'faculty', 'Wrong target')] }), base, 5, id), /could not be matched/);
});

test('subject extraction refuses conflicting faculty mappings instead of silently keeping the last value', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()] }), snapshot(), 1, id);
  assert.throws(() => actions.normalizeSubjectActions(draft({ subjects: [{ name: 'Math', faculty: 'Teacher A' }], changes: [change('subject', base.subjects[0].id, 'faculty', 'Teacher B')] }), base, 1), /Conflicting faculty/);
  const renamed = actions.planAcademicActions(draft({ changes: [change('subject', base.subjects[0].id, 'name', 'M')] }), base, 1, id);
  assert.equal(renamed.subjects[0].name, 'M');
});

 test('unknown AI subject types require a manual choice instead of defaulting to theory', () => {
  assert.throws(() => actions.planAcademicActions(draft({ subjects: [{ name: 'Unknown' }] }), snapshot(), 1, id), /Choose Theory/);
 });
 test('matching abbreviated lab sessions infer practical type without affecting other subjects', () => {
  const request = draft({ subjects: [{ name: 'Artificial Intelligence' }, { name: 'Object Oriented Modelling' }, { name: 'History' }], classes: [{ ...lesson('AI Lab'), type: 'lab' }, { ...lesson('OOM Lab'), type: 'lab' }] });
  const normalized = actions.normalizeSubjectActions(request, snapshot(), 1);
  assert.deepEqual(Array.from(normalized.subjects, row => row.type), ['lab', 'lab', '']);
  const manual = actions.normalizeSubjectActions(draft({ subjects: [{ name: 'Artificial Intelligence', type: 'theory' }], classes: request.classes }), snapshot(), 1);
  assert.equal(manual.subjects[0].type, 'theory');
 });

test('AI subject choices match the manual form and legacy elective needs a real teaching type', () => {
  assert.equal(draft({ subjects: [{ name: 'Academic Elective', type: 'elective' }] }).subjects[0].type, '');
  assert.throws(() => actions.planAcademicActions(draft({ subjects: [{ name: 'Academic Elective', type: 'elective' }] }), snapshot(), 1, id), /Choose Theory/);
  assert.equal(actions.planAcademicActions(draft({ subjects: [{ name: 'Academic Elective', type: 'lab' }] }), snapshot(), 1, id).subjects[0].type, 'lab');
});

test('AI imports assign varied colors and preserve chosen and existing colors', () => {
  const request = draft({ subjects: [subject('Math'), subject('Physics'), subject('Biology'), { ...subject('Art'), color: '#123456' }] });
  const normalized = actions.normalizeSubjectActions(request, snapshot(), 1);
  assert.equal(new Set(Array.from(normalized.subjects, row => row.color)).size, 4);
  assert.equal(normalized.subjects[3].color, '#123456');
  const plan = actions.planAcademicActions(normalized, snapshot(), 1, id);
  const repeated = actions.planAcademicActions(draft({ subjects: [subject('Math')] }), plan, 1, id);
  assert.equal(repeated.subjects[0].color, plan.subjects[0].color);
});

test('duplicate names for the same course retain the full title in either order', () => {
  for (const names of [['Data Exploration', 'Data Exploration and Visualization'], ['Data Exploration and Visualization', 'Data Exploration']]) {
    const normalized = actions.normalizeSubjectActions(draft({ subjects: names.map(name => ({ name, code: 'DEV101', type: 'theory' })) }), snapshot(), 1);
    assert.equal(normalized.subjects.length, 1);
    assert.equal(normalized.subjects[0].name, 'Data Exploration and Visualization');
  }
  const base = actions.planAcademicActions(draft({ subjects: [subject('Data Exploration')] }), snapshot(), 1, id);
  const normalized = actions.normalizeSubjectActions(draft({ subjects: [
    { id: base.subjects[0].id, name: 'Data Exploration' },
    { id: base.subjects[0].id, name: 'Data Exploration and Visualization' }
  ] }), base, 1);
  assert.equal(normalized.subjects[0].name, 'Data Exploration and Visualization');
  assert.throws(() => actions.normalizeSubjectActions(draft({ subjects: [
    { name: 'Physics', code: 'SAME' }, { name: 'History', code: 'SAME' }
  ] }), snapshot(), 1), /Conflicting name/);
});

test('conflicting AI proposals remain editable in review but cannot save until corrected', () => {
  const request = draft({ subjects: [
    { name: 'Physics', code: 'SAME', type: 'theory' },
    { name: 'History', code: 'SAME', type: 'theory' }
  ] });
  const review = actions.subjectActionsForReview(request, snapshot(), 1);
  assert.equal(review.subjects.length, 2);
  assert.equal(review.subjects[1].name, 'History');
  assert.throws(() => actions.planAcademicActions(review, snapshot(), 1, id), /Conflicting name/);
  review.subjects.splice(1, 1);
  review.subjects[0].type = 'theory';
  assert.equal(actions.planAcademicActions(review, snapshot(), 1, id).subjects.length, 1);
});

test('marksheet-only import saves scorecard results without creating Subjects or timetable rows', () => {
  const request = draft({ semester: 3, results: [
    { subject: 'Mathematics', credits: 4, gradePoint: 9 },
    { subject: 'Physics', credits: 2, gradePoint: 8 }
  ] });
  const first = actions.planAcademicActions(request, snapshot(), 3, id);
  assert.equal(first.subjects.length, 0);
  assert.equal(first.entries.length, 0);
  assert.equal(first.semesters[0].sgpa, 8.67);
  assert.equal(first.semesters[0].totalCredits, 6);
  assert.equal(first.semesters[0].sgpaSubjects.length, 2);
  const repeated = actions.planAcademicActions(request, first, 3, id);
  assert.equal(repeated.semesters[0].sgpaSubjects.length, 2);
  const second = actions.planAcademicActions(draft({ reportedSgpa: 9, reportedCredits: 6 }), repeated, 4, id);
  assert.equal(second.semesters.length, 2);
  assert.equal(second.semesters[0].sgpa, 8.67);
  assert.equal(second.semesters[1].sgpa, 9);
});

test('subject-only image proposals use lab labels even when model incorrectly says theory', () => {
  const request = draft({ subjects: [
    { name: 'Object Oriented Modelling', type: 'theory', typeEvidence: 'OOM LAB' },
    { name: 'Artificial Intelligence', type: 'theory', typeEvidence: 'AI LAB' },
    { name: 'History', type: 'theory' }
  ] });
  const review = actions.subjectActionsForReview(request, snapshot(), 1);
  assert.equal(review.subjects[0].type, 'lab');
  assert.equal(review.subjects[1].type, 'lab');
  assert.equal(review.subjects[2].type, '');
  review.subjects[0].type = 'theory';
  assert.equal(actions.normalizeSubjectActions(review, snapshot(), 1).subjects[0].type, 'theory');
});

test('Sunday classes support weekly schedules, dated classes and attendance ranges', () => {
  const weekly = actions.planAcademicActions(draft({ subjects: [subject()], classes: [{ ...lesson(), day: 6 }] }), snapshot(), 1, id);
  assert.equal(weekly.entries[0].dayOfWeek, 6);
  const marked = actions.planAcademicActions(draft({ attendanceRanges: [{ subject: 'Math', from: '2026-10-18', to: '2026-10-18', day: 6, status: 'present' }] }), weekly, 1, id);
  assert.equal(marked.records.length, 1);
  assert.equal(marked.records[0].date, '2026-10-18');
  const dated = actions.planAcademicActions(draft({ subjects: [subject()], classes: [{ ...lesson(), date: '2026-10-18' }] }), snapshot(), 1, id);
  assert.equal(dated.entries[0].dayOfWeek, 6);
});

test('class review lists problems on each editable class and clears them after correction', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson()] }), snapshot(), 1, id);
  const request = draft({ classes: [{ ...lesson('Missing'), start: '', day: null }, lesson('Math', '09:30', '10:30'), lesson('Math', '10:00', '11:00')] });
  const issues = actions.classReviewIssues(request, base, 1);
  assert.equal(issues[0].length, 3);
  assert.ok(issues[1].some(issue => issue.includes('saved class')));
  assert.ok(issues[1].some(issue => issue.includes('proposed class 3')));
  assert.ok(issues[2].some(issue => issue.includes('proposed class 2')));
  request.classes = [lesson('Math', '11:00', '12:00')];
  assert.equal(actions.classReviewIssues(request, base, 1)[0].length, 0);
});

test('lab labels resolve through course aliases and preserve uploaded times and rooms', () => {
  const request = draft({ subjects: [{ ...subject('Object Oriented Modelling'), code: 'CS501' }], classes: [
    { ...lesson('CS501', '11:15', '12:10'), day: 2 },
    { ...lesson('OOM LAB', '14:55', '16:45'), day: 3, room: 'LAB-SH', type: '' }
  ] });
  const reviewed = actions.subjectActionsForReview(request, snapshot(), 5);
  assert.equal(reviewed.classes[1].subject, 'Object Oriented Modelling');
  assert.equal(reviewed.classes[1].type, 'lab');
  reviewed.subjects[0].type = 'lab';
  assert.throws(() => actions.planAcademicActions(reviewed, snapshot(), 5, id), /Confirm mapping/);
  reviewed.classes[1].mappingConfirmed = true;
  const plan = actions.planAcademicActions(reviewed, snapshot(), 5, id);
  assert.equal(plan.entries.length, 2);
  assert.equal(plan.entries[1].dayOfWeek, 3);
  assert.equal(plan.entries[1].startTime, '14:55');
  assert.equal(plan.entries[1].endTime, '16:45');
  assert.equal(plan.entries[1].room, 'LAB-SH');
});

test('ambiguous lab abbreviations remain unresolved for manual review', () => {
  const request = draft({ subjects: [subject('Artificial Intelligence'), subject('Advanced Intelligence')], classes: [{ ...lesson('AI LAB'), type: 'lab' }] });
  const reviewed = actions.normalizeSubjectActions(request, snapshot(), 1);
  assert.equal(reviewed.classes[0].subject, 'AI LAB');
  assert.ok(actions.classReviewIssues(reviewed, snapshot(), 1)[0].some(issue => issue.includes('Choose an existing subject')));
});

test('canonical model lab rows still ask for source-label mapping approval', () => {
  const request = draft({ subjects: [{ ...subject('Artificial Intelligence'), type: 'lab' }], classes: [{ ...lesson('Artificial Intelligence'), type: 'lab', sourceLabel: 'AI LAB' }] });
  const review = actions.normalizeSubjectActions(request, snapshot(), 1);
  assert.equal(review.classes[0].mappedFrom, 'AI LAB');
  assert.throws(() => actions.planAcademicActions(review, snapshot(), 1, id), /Confirm mapping/);
  review.classes[0].mappingConfirmed = true;
  assert.equal(actions.planAcademicActions(review, snapshot(), 1, id).entries[0].type, 'lab');
});

test('replacement removes old weekly slots before validating redundant edits to them', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject(), subject('Physics')], classes: [lesson(), lesson('Physics', '10:00', '11:00')] }), snapshot(), 1, id);
  const request = draft({ changes: [change('class', base.entries[0].id, 'endTime', '10:30')], classes: [lesson('Math', '12:10', '13:05')] });
  const plan = actions.planAcademicActions(request, base, 1, id, true);
  assert.equal(plan.entries.length, 1);
  assert.equal(plan.entries[0].startTime, '12:10');
  assert.equal(actions.classReviewIssues(request, base, 1, true)[0].length, 0);
});

test('replacement reports imported conflicts without suggesting replacement again', () => {
  const request = draft({ subjects: [subject(), subject('Physics')], classes: [lesson(), lesson('Physics', '09:30', '10:30')] });
  assert.throws(() => actions.planAcademicActions(request, snapshot(), 1, id, true), /Old weekly classes are already excluded/);
  assert.equal(actions.classReviewIssues(request, snapshot(), 1, true).filter(issues => issues.length).length, 2);
});

test('generic timetable cleaning fixes explicit notation and duplicate rows without guessing period', () => {
  const request = draft({ classes: [
    { ...lesson('Astronomy', '1:15 PM', '2.05 PM'), day: 6 },
    { ...lesson('Astronomy', '13:15', '14:05'), day: 6 },
    lesson('History', '1:05', '2:00'),
    { ...lesson('Astronomy', '13:15', '14:05'), day: 6, room: 'Different lab' },
  ] });
  const clean = actions.cleanTimetableProposal(request);
  assert.equal(clean.classes.length, 3);
  assert.equal(clean.classes[0].start, '13:15');
  assert.equal(clean.classes[0].end, '14:05');
  assert.equal(clean.classes[1].start, '01:05');
  assert.equal(clean.classes[2].room, 'Different lab');
  assert.equal(request.classes.length, 4);
});

test('replacement scope handles dated classes and preserves other semesters', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()], classes: [lesson(), { ...lesson('Math', '11:00', '12:00'), date: '2026-10-19' }] }), snapshot(), 1, id);
  const otherSemester = actions.planAcademicActions(draft({ subjects: [subject('Physics')], classes: [lesson('Physics')] }), base, 2, id);
  const request = draft({ classes: [lesson('Math', '11:15', '12:10')] });
  assert.throws(() => actions.planAcademicActions(request, otherSemester, 1, id, true), /saved dated class/);
  const full = actions.planAcademicActions(request, otherSemester, 1, id, true, true);
  assert.equal(full.entries.length, 2);
  assert.ok(full.entries.some(entry => entry.subjectId === otherSemester.subjects.find(subject => subject.semesterId === '2').id));
  assert.equal(actions.classReviewIssues(request, otherSemester, 1, true, true)[0].length, 0);
});

function preparationClient(base, replies) {
  let calls = 0;
  const instructions = [];
  const service = load('src/features/ai/services/academicActions.ts', {
    './aiService': { askCampusIQAI: async (_query, _fallback, _image, _progress, options) => { instructions.push(options.structuredInstruction); const reply = replies[calls++]; if (reply instanceof Error) throw reply; return { reply: JSON.stringify(reply), provider: 'gemma-local' }; } },
    './applyAcademicActions': { actionSnapshot: () => base },
    './actionDraft': actions,
    '@/stores/useProfileStore': { useProfileStore: { getState: () => ({ profile: { currentSemester: 1 } }) } },
    '@/stores/useSubjectStore': { useSubjectStore: { getState: () => ({ subjects: base.subjects }) } },
  });
  return { prepare: service.prepareAcademicActions, calls: () => calls, instructions };
}
test('one corrective pass repairs imported clashes without changing unrelated actions', async () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject(), subject('Physics')] }), snapshot(), 1, id);
  const original = { classes: [lesson(), lesson('Physics', '09:30', '10:30')] };
  const fixed = { classes: [lesson(), lesson('Physics', '10:00', '11:00')], changes: [{ target: 'subject', id: base.subjects[0].id, operation: 'delete', field: '', value: '' }] };
  const client = preparationClient(base, [original, fixed]);
  const prepared = await client.prepare('Import the timetable');
  assert.equal(client.calls(), 2);
  assert.equal(prepared.draft.classes[1].start, '10:00');
  assert.equal(prepared.draft.changes.length, 0);
});
test('valid imports use one request and genuine clashes stay reviewable after one failed repair', async () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject(), subject('Physics')] }), snapshot(), 1, id);
  const valid = preparationClient(base, [{ classes: [lesson()] }]);
  await valid.prepare('Import timetable');
  assert.equal(valid.calls(), 1);
  const conflict = { classes: [lesson(), lesson('Physics', '09:30', '10:30')] };
  const client = preparationClient(base, [conflict, conflict]);
  const prepared = await client.prepare('Import timetable');
  assert.equal(client.calls(), 2);
  assert.equal(prepared.draft.classes.length, 2);
  assert.throws(() => actions.planAcademicActions(prepared.draft, base, 1, id, true), /overlaps/);
});

test('zero-credit results are valid, retained, and excluded from GPA weighting and backlogs', () => {
  const plan = actions.planAcademicActions(draft({ results: [
    { subject: 'Western Music', credits: 0, grade: 'PP', gradePoint: 0, marks: 100, maxMarks: 100 },
    { subject: 'Math', credits: 3, gradePoint: 9 }
  ] }), snapshot(), 1, id);
  assert.equal(plan.semesters[0].sgpa, 9);
  assert.equal(plan.semesters[0].totalCredits, 3);
  assert.equal(plan.semesters[0].sgpaSubjects[0].credits, '0');
  assert.equal(plan.semesters[0].backlogCount, 0);
  const noncredit = actions.planAcademicActions(draft({ results: [{ subject: 'Music', credits: 0, grade: 'PP' }] }), snapshot(), 1, id);
  assert.equal(noncredit.semesters[0].sgpa, 0);
  assert.equal(noncredit.semesters[0].sgpaSubjects[0].gradePoint, '');
  assert.throws(() => actions.planAcademicActions(draft({ results: [{ subject: 'Music', gradePoint: 9 }] }), snapshot(), 1, id), /Enter credits/);
});

test('narrated promises recover into a real review draft without asking for confirmation again', async () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()] }), snapshot(), 1, id);
  const client = preparationClient(base, [{ message: 'I am preparing the timetable for your review.' }, { message: 'Ready to review.', classes: [lesson()] }]);
  const result = await client.prepare('Yeah do it');
  assert.equal(client.calls(), 2);
  assert.equal(result.draft.classes.length, 1);
});
test('a second empty promise reports failure honestly instead of an imaginary next step', async () => {
  const promise = { message: "I'll present this in the review step." };
  const client = preparationClient(snapshot(), [promise, promise]);
  const result = await client.prepare('Go ahead');
  assert.equal(client.calls(), 2);
  assert.match(result.draft.message, /did not return a usable change draft/);
  assert.equal(result.draft.classes.length, 0);
});

test('AM/PM mistakes outside configured hours are flagged without assuming all colleges use daytime schedules', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject()] }), snapshot(), 1, id);
  base.preferences = { collegeStartTime: '08:00', collegeEndTime: '18:00' };
  const wrong = draft({ classes: [lesson('Math', '02:55', '03:50')] });
  assert.ok(actions.classReviewIssues(wrong, base, 1)[0].some(issue => issue.includes('Check AM/PM')));
  assert.equal(actions.classReviewIssues(draft({ classes: [lesson('Math', '14:55', '15:50')] }), base, 1)[0].length, 0);
  base.preferences = {};
  assert.equal(actions.classReviewIssues(wrong, base, 1)[0].length, 0);
});

test('follow-up corrections include the actual pending proposal and retain it honestly if no correction returns', async () => {
  const pending = draft({ classes: [{ ...lesson('Math', '02:55', '03:50'), type: 'lab', sourceLabel: 'MATH LAB', mappedFrom: 'MATH LAB', mappingConfirmed: true }] });
  const client = preparationClient(snapshot(), [{ message: 'Which time should I change?' }, { message: 'No changes.' }]);
  const result = await client.prepare('Check the AM and PM properly', undefined, [], undefined, undefined, pending);
  assert.ok(client.instructions[0].includes('CURRENT UNSAVED REVIEW PROPOSAL'));
  assert.ok(client.instructions[0].includes('02:55'));
  assert.equal(result.draft.classes.length, 1);
  assert.equal(result.draft.classes[0].mappingConfirmed, true);
  assert.match(result.draft.message, /not been newly verified/);
});

test('ordered time headers resolve noon rollover and merged afternoon lab spans', () => {
  const timeColumns = [
    { start: '08:00', end: '08:55' }, { start: '08:55', end: '09:50' },
    { start: '09:50', end: '10:45' }, { start: '10:45', end: '11:15' },
    { start: '11:15', end: '12:10' }, { start: '12:10', end: '01:05' },
    { start: '01:05', end: '02:00' }, { start: '02:00', end: '02:55' },
    { start: '02:55', end: '03:50' }, { start: '03:50', end: '04:45' },
    { start: '04:45', end: '05:40' },
  ];
  const result = actions.cleanTimetableProposal(draft({ timeColumns, classes: [
    lesson('Course', '02:55', '03:50'), { ...lesson('Course', '02:55', '04:45'), day: 1, type: 'lab' },
    { ...lesson('Course', '12:10', '01:05'), day: 2 },
  ] }));
  assert.equal(result.classes[0].start, '14:55');
  assert.equal(result.classes[0].end, '15:50');
  assert.equal(result.classes[1].end, '16:45');
  assert.equal(result.classes[2].end, '13:05');
});
test('ambiguous isolated headers stay unchanged and explicit night schedules work', () => {
  assert.equal(actions.resolveTimetableHeaders([{ start: '2:55', end: '3:50' }]), null);
  const night = actions.resolveTimetableHeaders([{ start: '20:00', end: '21:00' }, { start: '9:00', end: '10:00' }]);
  assert.equal(night[1].start, '21:00');
  assert.equal(night[1].end, '22:00');
  assert.equal(actions.resolveTimetableHeaders([{ start: '25:00', end: '26:00' }]), null);
});

test('lecture aliases automatically reuse saved subjects without adding duplicates', () => {
  const base = actions.planAcademicActions(draft({ subjects: [subject('Computer Networks'), subject('Object Oriented Modelling')] }), snapshot(), 5, id);
  const request = draft({ classes: [lesson('CN'), { ...lesson('Friday', '11:00', '12:00'), sourceLabel: 'OOM' }] });
  const reviewed = actions.normalizeSubjectActions(request, base, 5);
  assert.equal(reviewed.classes[0].subject, 'Computer Networks');
  assert.equal(reviewed.classes[1].subject, 'Object Oriented Modelling');
  const plan = actions.planAcademicActions(reviewed, base, 5, id);
  assert.equal(plan.subjects.length, 2);
  assert.equal(plan.entries.length, 2);
});
test('weekday-only class labels cannot be mistaken for a course without source evidence', () => {
  const request = draft({ classes: [lesson('Friday')] });
  const reviewed = actions.normalizeSubjectActions(request, snapshot(), 1);
  assert.equal(reviewed.classes[0].subject, 'Friday');
  assert.throws(() => actions.planAcademicActions(reviewed, snapshot(), 1, id), /timetable heading/);
});
test('subject-only requests cannot accidentally add classes or results', () => {
  const request = draft({ subjects: [subject()], classes: [lesson()], results: [{ subject: 'Math', credits: 3, gradePoint: 9 }] });
  const scoped = actions.constrainSubjectImport('Add the subjects from this timetable', request);
  assert.equal(scoped.subjects.length, 1);
  assert.equal(scoped.classes.length, 0);
  assert.equal(scoped.results.length, 0);
  assert.equal(actions.constrainSubjectImport('Add subjects and timetable', request).classes.length, 1);
});

test('scorecard screen preserves AI-only courses and does not duplicate matching tracker courses', () => {
  const { mergeScorecardRows, reconcileScorecardEdits } = load('src/lib/scorecardRows.ts');
  const saved = [{ id: 'ai-course', name: 'Mathematics', code: 'MA101', credits: '4', totalMarks: '90', gradePoint: '9' }, { id: 'music', name: 'Music', code: 'NC1', credits: '0', totalMarks: '100', gradePoint: '0' }];
  assert.equal(mergeScorecardRows(saved, []).length, 2);
  const rows = mergeScorecardRows(saved, [{ id: 'tracker-course', name: 'Math', code: 'MA101', credits: 4 }, { id: 'physics', name: 'Physics', code: 'PH101', credits: 3 }]);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].gradePoint, '9');
  assert.equal(rows[1].credits, '0');
  const updated = [{ ...saved[0], gradePoint: '10', totalMarks: '100' }, saved[1]];
  const refreshed = reconcileScorecardEdits(updated, saved, new Map());
  assert.equal(refreshed[0].gradePoint, '10');
  const edited = reconcileScorecardEdits(updated, [{ ...saved[0], totalMarks: '85' }, saved[1]], new Map([['ai-course', new Set(['totalMarks'])]]));
  assert.equal(edited[0].totalMarks, '85');
  assert.equal(edited[0].gradePoint, '10');
});

test('marksheet follow-ups use the compact results path and update course codes without duplicates', async () => {
  const history = [{ role: 'user', content: 'This is my Semester 3 marks card.' }, { role: 'assistant', content: 'The result includes Western Music with PP and 0 credits.' }];
  const client = preparationClient(snapshot(), [{ semester: 3, results: [
    { subject: 'Mathematics', code: 'MA301', credits: 4, gradePoint: 9 },
    { subject: 'Western Music', code: 'NC301', credits: 0, grade: 'PP', gradePoint: null }
  ] }]);
  const result = await client.prepare('Hey add it to that sem', undefined, history);
  assert.equal(client.calls(), 1);
  assert.ok(client.instructions[0].startsWith('Extract the uploaded marksheet'));
  assert.ok(!client.instructions[0].includes('Attendance ranges'));
  const plan = actions.planAcademicActions(result.draft, snapshot(), 3, id);
  assert.equal(plan.semesters[0].number, 3);
  assert.equal(plan.semesters[0].sgpaSubjects[0].code, 'MA301');
  assert.equal(plan.semesters[0].sgpaSubjects[1].gradeLetter, 'PP');
  const updated = actions.planAcademicActions(draft({ results: [{ subject: 'Mathematics renamed', code: 'MA301', credits: 4, gradePoint: 10 }] }), plan, 3, id);
  assert.equal(updated.semesters[0].sgpaSubjects.length, 2);
  assert.equal(updated.semesters[0].sgpa, 10);
});

test('full marksheet imports recover omitted course rows instead of accepting totals alone', async () => {
  const client = preparationClient(snapshot(), [
    { semester: 3, reportedSgpa: 8.95, reportedCredits: 22, results: [] },
    { semester: 3, reportedSgpa: 8.95, reportedCredits: 22, results: [{ subject: 'Mathematics', code: 'MA301', credits: 4, gradePoint: 9 }] }
  ]);
  const result = await client.prepare('Add my marks card to semester 3');
  assert.equal(client.calls(), 2);
  assert.equal(result.draft.results.length, 1);
  const plan = actions.planAcademicActions(result.draft, snapshot(), 3, id);
  assert.equal(plan.semesters[0].sgpaSubjects.length, 1);
});
test('missing marksheet rows cannot silently save a summary-only import', async () => {
  const summary = { semester: 3, reportedSgpa: 8.95, reportedCredits: 22, results: [] };
  const client = preparationClient(snapshot(), [summary, summary]);
  const result = await client.prepare('Import this marksheet into semester 3');
  assert.equal(result.draft.reportedSgpa, null);
  assert.equal(actions.actionCount(result.draft), 0);
  assert.match(result.draft.message, /not the requested course rows/);
});
