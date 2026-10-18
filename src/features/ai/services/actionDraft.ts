import type { Profile } from '@/stores/useProfileStore';
import type { Subject, Semester, TimetableEntry, GradeEntry, Assignment, Exam, AttendanceRecord, GradeScheme, DayOfWeek, ClassType, ExamType, AttendanceStatus } from '@/types';

export interface ActionSubject { typeEvidence?: string; id?: string; name: string; code: string; faculty: string; description: string; room: string; shortName: string; type: 'theory' | 'lab' | ''; color: string; icon: string; credits: number | null }
export interface ActionClass { sourceLabel?: string; mappedFrom?: string; mappingConfirmed?: boolean; subject: string; day: number | null; date: string; start: string; end: string; room: string; color: string; type: 'lecture' | 'lab' | '' }
export interface ActionResult { code?: string; subject: string; credits: number | null; marks: number | null; maxMarks: number | null; grade: string; gradePoint: number | null }
export interface ActionAssignment { subject: string; title: string; date: string; notes: string; priority: 'low' | 'medium' | 'high' | '' }
export interface ActionExam { subject: string; date: string; start: string; room: string; notes: string; syllabus: string; type: ExamType }
export interface ActionAttendance { subject: string; date: string; start: string; note: string; status: AttendanceStatus }
export interface ActionChange { target: 'class' | 'subject' | 'assignment' | 'exam' | 'profile' | 'settings' | 'calendar'; id: string; operation: 'update' | 'delete'; field: string; value: string }
export interface AttendanceRange { subject: string; from: string; to: string; start: string; day: number | null; status: AttendanceStatus | 'unmarked' }
export interface AcademicActionDraft {
  timeColumns?: { start: string; end: string }[];
  message: string; semester: number | null; subjects: ActionSubject[]; classes: ActionClass[]; results: ActionResult[];
  changes: ActionChange[]; attendanceRanges: AttendanceRange[]; assignments: ActionAssignment[]; exams: ActionExam[]; attendance: ActionAttendance[]; reportedSgpa: number | null; reportedCredits: number | null;
}
export const actionCount = (draft: AcademicActionDraft) => draft.changes.length + draft.attendanceRanges.length + draft.subjects.length + draft.classes.length + draft.results.length + draft.assignments.length + draft.exams.length + draft.attendance.length + (draft.reportedSgpa != null ? 1 : 0);
export function isActionRequest(text: string) {
  return /\b(add|save|import|create|update|record|mark|schedule|set|put|change|remove|delete|remind|enter|edit|upload|input|fill|apply|reschedule|move|cancel|complete|finish|reopen|switch|postpone|clear|reset|make|shift|rename|enable|disable)\b/i.test(text) ||
    /\b(in\s+(?:the|my)\s+app|into\s+(?:the|my)\s+app)\b/i.test(text) ||
    /\b(i was|i am|i'm)\s+(absent|present)\b/i.test(text);
}
const record = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('The proposed changes were not valid. Please try again.'); return v as Record<string, unknown>; };
const text = (v: unknown, max = 160): string => { if (v == null) return ''; if (typeof v !== 'string' || v.length > max) throw new Error('Invalid text in proposed changes.'); return v.trim(); };
const number = (v: unknown, max: number): number | null => { if (v == null || v === '') return null; if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > max) throw new Error('Invalid number in proposed changes.'); return v; };
const choice = <T extends string>(v: unknown, values: readonly T[]): T => { if (!values.includes(v as T)) throw new Error('Unsupported action value.'); return v as T; };
export function parseActionDraft(raw: string): AcademicActionDraft {
  const data = record(JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')));
  const rows = <T>(key: string, parse: (row: Record<string, unknown>) => T): T[] => {
    const value = data[key] ?? [];
    if (!Array.isArray(value) || value.length > 100) throw new Error('Too many proposed changes. Import a smaller section.');
    return value.map(v => parse(record(v)));
  };
  const draft: AcademicActionDraft = {
    timeColumns: rows('timeColumns', r => ({ start: text(r.start, 20), end: text(r.end, 20) })),
    message: text(data.message, 6000), semester: number(data.semester, 20), reportedSgpa: number(data.reportedSgpa, 10), reportedCredits: number(data.reportedCredits, 100),
    changes: rows('changes', r => ({ target: choice(r.target, ['class', 'subject', 'assignment', 'exam', 'profile', 'settings', 'calendar']), id: text(r.id), operation: choice(r.operation, ['update', 'delete']), field: text(r.field, 40), value: text(r.value, 500) })),
    attendanceRanges: rows('attendanceRanges', r => ({ subject: text(r.subject, 400), from: text(r.from, 10), to: text(r.to, 10), start: text(r.start, 5), day: number(r.day, 6), status: choice(r.status, ['present', 'absent', 'cancelled', 'holiday', 'unmarked']) })),
    subjects: rows('subjects', r => ({ typeEvidence: text(r.typeEvidence, 400), id: text(r.id), name: text(r.name, 400), code: text(r.code, 80), faculty: text(r.faculty, 240), description: text(r.description, 1500), room: text(r.room, 120), shortName: text(r.shortName, 40), type: choice(r.type === 'elective' ? '' : r.type ?? '', ['', 'theory', 'lab']), color: text(r.color, 7), icon: text(r.icon, 80), credits: number(r.credits, 30) })),
    classes: rows('classes', r => ({ sourceLabel: text(r.sourceLabel, 400), mappedFrom: text(r.mappedFrom, 400), mappingConfirmed: r.mappingConfirmed === true, subject: text(r.subject, 400), day: number(r.day, 6), date: text(r.date, 10), start: text(r.start, 20), end: text(r.end, 20), room: text(r.room, 120), color: text(r.color, 7), type: choice(r.type ?? '', ['', 'lecture', 'lab']) })),
    results: rows('results', r => ({ code: text(r.code, 80), subject: text(r.subject, 400), credits: number(r.credits, 30), marks: number(r.marks, 10000), maxMarks: number(r.maxMarks, 10000), grade: text(r.grade, 12), gradePoint: number(r.gradePoint, 10) })),
    assignments: rows('assignments', r => ({ subject: text(r.subject, 400), title: text(r.title, 400), date: text(r.date, 10), notes: text(r.notes, 1500), priority: choice(r.priority ?? '', ['', 'low', 'medium', 'high']) })),
    exams: rows('exams', r => ({ subject: text(r.subject, 400), date: text(r.date, 10), start: text(r.start, 5), room: text(r.room, 120), notes: text(r.notes, 1500), syllabus: text(r.syllabus, 2000), type: choice(r.type ?? 'endsem', ['midsem', 'endsem', 'quiz', 'viva', 'practical', 'assignment']) })),
    attendance: rows('attendance', r => ({ subject: text(r.subject, 400), date: text(r.date, 10), start: text(r.start, 5), note: text(r.note, 1000), status: choice(r.status, ['present', 'absent', 'cancelled', 'holiday']) })),
  };
  if (actionCount(draft) > 180) throw new Error('Import a smaller section at a time.');
  return draft;
}
export interface ActionSnapshot { events?: Record<string, 'holiday' | 'exam'>; profile?: Profile | null; preferences?: Record<string, string | number | boolean>; semesterStartDate?: string; semesterEndDate?: string; currentSemester?: number; subjects: Subject[]; semesters: Semester[]; entries: TimetableEntry[]; gradeEntries: GradeEntry[]; assignments: Assignment[]; exams: Exam[]; records: AttendanceRecord[]; gradeScheme: GradeScheme }
export interface ActionPlan extends ActionSnapshot { summary: string[]; calculatedSgpa?: number }
const key = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
const courseAlias = (value: string) => key(value).replace(/[^a-z0-9]/g, '');
const nonCourseLabel = (value: string) => /^(mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?|lunch( break)?|break|day|time)$/i.test(value.trim());
function courseMatches(course: { name: string; code: string; shortName?: string }, reference: string) {
  if (!reference || nonCourseLabel(reference)) return false;
  return [course.name, course.code, course.shortName || ''].filter(Boolean).some(name => {
    const words = name.match(/[a-z0-9]+/gi) || [];
    return courseAlias(name) === courseAlias(reference) || (words.length > 1 && courseAlias(words.map(word => word[0]).join('')) === courseAlias(reference));
  });
}

const validTime = (v: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v);
const validDate = (v: string) => { const date = new Date(`${v}T12:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === v; };
function need(test: unknown, message: string): asserts test { if (!test) throw new Error(message); }

/** Pure planning: validate every change before any store is written. */
export function planAcademicActions(draft: AcademicActionDraft, snapshot: ActionSnapshot, semester: number, id: () => string, replaceWeekly = false, replaceDated = false): ActionPlan {
  draft = normalizeSubjectActions(draft, snapshot, semester);
  need(Number.isInteger(semester) && semester >= 1 && semester <= 20, 'Choose a semester from 1 to 20.');
  need(actionCount(draft) > 0, 'No supported changes were extracted.');
  const plan: ActionPlan = { ...snapshot, subjects: [...snapshot.subjects], semesters: [...snapshot.semesters], entries: [...snapshot.entries], gradeEntries: [...snapshot.gradeEntries], assignments: [...snapshot.assignments], exams: [...snapshot.exams], records: [...snapshot.records], events: { ...snapshot.events }, profile: snapshot.profile ? { ...snapshot.profile } : snapshot.profile, preferences: { ...snapshot.preferences }, summary: [] };
  const semesterId = String(semester);
  const find = (name: string) => {
    const matches = plan.subjects.filter(s => s.semesterId === semesterId && (s.id === name || courseMatches(s, name)));
    need(matches.length <= 1, `More than one subject matches “${name}”. Rename it in Subjects first.`);
    return matches[0];
  };
  let newSubjects = 0, updatedSubjects = 0, newClasses = 0, tasks = 0, exams = 0, attendance = 0;
  for (const row of draft.subjects) {
    need(row.name && row.name.length <= 400, 'Enter a name for every subject.');
    if (row.color) need(/^#[a-f0-9]{6}$/i.test(row.color), 'Subject color must use a six-digit hex color.');
    if (row.icon) need(/^[a-z][a-z0-9-]*$/.test(row.icon), 'Choose a valid subject icon.');
    const existing = row.id ? plan.subjects.find(s => s.id === row.id && s.semesterId === semesterId) : find(row.code || row.name) ?? find(row.name);
    need(!row.id || existing, `No saved subject matches “${row.name || row.id}” in semester ${semester}. Regenerate these changes.`);
    if (existing) {
      need(row.type || existing.type !== 'elective', `Choose Theory Only or Theory + Practical for “${row.name}” before saving.`);
      const shortenedName = key(existing.name).startsWith(`${key(row.name)} `);
      const shortenedCode = !!row.code && existing.code.startsWith(row.code) && row.code.length < existing.code.length;
      const updates = { name: shortenedName ? existing.name : row.name, code: shortenedCode ? existing.code : row.code || existing.code, faculty: row.faculty || existing.faculty, credits: row.credits ?? existing.credits,
        description: row.description || existing.description, room: row.room || existing.room, shortName: row.shortName || existing.shortName, type: row.type || existing.type, color: row.color || existing.color, icon: row.icon || existing.icon };
      if (shortenedName || shortenedCode) plan.summary.push(`Keep the saved full name/code for ${existing.name}; the extracted label was shorter. Use an explicit subject edit if you intend to shorten it.`);
      if (Object.entries(updates).some(([field, value]) => (existing as unknown as Record<string, unknown>)[field] !== value)) {
        plan.subjects = plan.subjects.map(s => s.id === existing.id ? { ...s, ...updates } : s);
        updatedSubjects++;
      }
      continue;
    }
    need(row.credits == null || (row.credits >= 0 && row.credits <= 30), 'Credits must be between 0 and 30.');
    need(row.type, `Choose Theory Only or Theory + Practical for “${row.name}” before saving.`);
    plan.subjects.push({ id: id(), name: row.name, code: row.code, shortName: row.shortName || row.code || row.name.slice(0, 3).toUpperCase(), credits: row.credits ?? 0, semesterId, faculty: row.faculty, description: row.description, room: row.room, color: row.color || '#3B82F6', icon: row.icon || undefined, type: row.type as Subject['type'], createdAt: new Date() });
    newSubjects++;
  }
  const subject = (name: string) => { const found = find(name); need(found, `Add or select the subject “${name}” in the subject list for semester ${semester}.`); return found; };
  const activeIds = new Set(plan.subjects.filter(s => s.semesterId === semesterId).map(s => s.id));
  const replacedClassIds = new Set<string>();
  if (replaceWeekly && draft.classes.length) {
    plan.entries.filter(e => activeIds.has(e.subjectId) && (replaceDated || !e.date)).forEach(entry => replacedClassIds.add(entry.id));
    const removed = replacedClassIds.size;
    plan.entries = plan.entries.filter(e => !replacedClassIds.has(e.id));
    plan.summary.push(`Replace ${removed} existing ${replaceDated ? 'weekly and dated' : 'weekly'} classes in semester ${semester}.`);
  }
  applyRecordChanges(draft.changes.filter(change => change.target !== 'class' || !replacedClassIds.has(change.id)), plan, semester);
  for (let row of draft.classes) {
    need(!row.mappedFrom || row.mappingConfirmed, `Confirm mapping “${row.mappedFrom}” to “${row.subject}” in the class review before saving.`);
    need(!nonCourseLabel(row.subject), `“${row.subject}” is a timetable heading, not a course. Recheck this source cell before saving.`);
    const s = subject(row.subject);
    if (row.color) need(/^#[a-f0-9]{6}$/i.test(row.color), 'Class color must use a six-digit hex color.');
    if (row.date) {
      need(validDate(row.date), 'Extra classes need a valid YYYY-MM-DD date.');
      row = { ...row, day: (new Date(`${row.date}T12:00:00Z`).getUTCDay() + 6) % 7 };
    }
    need(row.day != null && Number.isInteger(row.day) && row.day >= 0 && row.day <= 6, 'Choose Monday–Sunday for each class.');
    need(validTime(row.start) && validTime(row.end) && row.end > row.start, 'Class times must use HH:MM (24-hour), with the end after the start.');
    const existingClass = plan.entries.find(e => (e.date ?? '') === row.date && e.subjectId === s.id && e.dayOfWeek === row.day && e.startTime === row.start && e.endTime === row.end);
    if (existingClass) {
      const updated = { ...existingClass, room: row.room || existingClass.room, color: row.color || existingClass.color, type: row.type || existingClass.type };
      plan.entries = plan.entries.map(e => e.id === existingClass.id ? updated : e);
      if (updated.room !== existingClass.room || updated.color !== existingClass.color || updated.type !== existingClass.type) plan.summary.push(`Update room, type or color for ${s.name} ${row.start}–${row.end}; retain the saved class ID.`);
      continue;
    }
    const conflict = plan.entries.find(e => activeIds.has(e.subjectId) && classDatesOverlap(e, { dayOfWeek: row.day!, date: row.date || undefined }) && row.start < e.endTime && row.end > e.startTime);
    need(!conflict, `${s.name} ${row.start}–${row.end} overlaps ${plan.subjects.find(subject => subject.id === conflict?.subjectId)?.name || 'another class'} ${conflict?.startTime}–${conflict?.endTime}${conflict?.date ? ` on ${conflict.date} (saved dated class)` : ''}. ${replaceWeekly ? 'Old weekly classes are already excluded; correct the conflicting new or dated class in review.' : 'Correct the class or enable Replace weekly timetable to remove old weekly slots.'}`);
    plan.entries.push({ id: id(), subjectId: s.id, dayOfWeek: row.day as DayOfWeek, date: row.date || undefined, startTime: row.start, endTime: row.end, room: row.room, color: row.color || undefined, type: (row.type || 'lecture') as ClassType }); newClasses++;
  }
  if (draft.reportedSgpa != null && !draft.results.length) {
    const existing = plan.semesters.find(s => s.number === semester);
    need(!existing?.sgpaSubjects?.some(r => r.gradePoint !== '') && !plan.gradeEntries.some(e => e.semesterId === existing?.id), 'This semester has detailed results. Update those results to recalculate SGPA instead of replacing only the total.');
    const credits = draft.reportedCredits ?? existing?.totalCredits;
    need(credits != null && credits > 0, 'Enter total semester credits to save a reported SGPA.');
    need(draft.reportedSgpa >= 0 && draft.reportedSgpa <= 10, 'SGPA must be between 0 and 10.');
    if (existing) plan.semesters = plan.semesters.map(s => s.id === existing.id ? { ...s, sgpa: draft.reportedSgpa!, totalCredits: credits } : s);
    else plan.semesters.push({ id: id(), number: semester, name: `Semester ${semester}`, isCurrent: snapshot.currentSemester === semester, sgpa: draft.reportedSgpa, totalCredits: credits });
    plan.summary.push(`Save reported SGPA ${draft.reportedSgpa} with ${credits} credits in semester ${semester}. No subject grades are invented.`);
  }
  if (draft.results.length) {
    let sem = plan.semesters.find(s => s.number === semester);
    if (!sem) { sem = { id: id(), name: `Semester ${semester}`, number: semester, isCurrent: snapshot.currentSemester === semester }; plan.semesters.push(sem); }
    const rows = (sem.sgpaSubjects ?? []).map(r => ({ ...r }));
    // Preserve legacy detailed grades when normalizing this semester to the scorecard format.
    for (const entry of snapshot.gradeEntries.filter(e => e.semesterId === sem.id)) {
      const s = plan.subjects.find(s => s.id === entry.subjectId);
      if (s && !rows.some(r => r.id === s.id)) rows.push({ id: s.id, name: s.name, code: s.code, credits: String(entry.credits), totalMarks: '', gradePoint: String(entry.gradePoint) });
    }
    const imported = new Set<string>();
    for (const row of draft.results) {
      need(row.subject.trim(), 'Enter a subject name for every result.');
      const savedRow = rows.find(item => key(item.name) === key(row.subject) || (item.code && (key(item.code) === key(row.subject) || (row.code && key(item.code) === key(row.code)))));
      // Scorecards own their course rows; importing marks need not create attendance subjects.
      const s = (row.code ? find(row.code) : undefined) ?? find(row.subject) ?? { id: savedRow?.id ?? id(), name: savedRow?.name ?? row.subject, code: row.code || savedRow?.code || '', credits: savedRow ? Number(savedRow.credits) : 0 };
      need(!imported.has(s.id), `Repeated result for ${s.name}. Keep one row.`); imported.add(s.id);
      const credits = row.credits ?? (s.credits > 0 ? s.credits : null);
      need(credits != null && Number.isFinite(credits) && credits >= 0 && credits <= 30, `Enter credits for ${s.name} (0 is allowed).`);
      let gp = row.gradePoint;
      if (gp == null && row.grade) gp = snapshot.gradeScheme.boundaries.find(b => key(b.gradeLetter) === key(row.grade))?.gradePoints ?? null;
      let percent: number | null = null;
      if (row.marks != null) {
        need(row.maxMarks != null && row.maxMarks > 0 && row.marks >= 0 && row.marks <= row.maxMarks, `Enter valid marks and maximum marks for ${s.name}.`);
        percent = row.marks / row.maxMarks * 100;
        if (gp == null) gp = snapshot.gradeScheme.boundaries.find(b => percent! >= b.minMarks && percent! <= b.maxMarks)?.gradePoints ?? null;
      }
      need((credits === 0 && gp == null) || (gp != null && Number.isFinite(gp) && gp >= 0 && gp <= 10), `Enter a grade point (0–10) for ${s.name}, or marks/grade matching your grading scheme.`);
      const updated = { id: s.id, name: s.name, code: row.code || s.code, gradeLetter: row.grade || undefined, credits: String(credits), totalMarks: percent == null ? '' : String(Math.round(percent * 100) / 100), gradePoint: gp == null ? '' : String(gp) };
      const index = rows.findIndex(r => r.id === s.id || key(r.name) === key(s.name));
      if (index < 0) rows.push(updated); else rows[index] = updated;
      plan.subjects = plan.subjects.map(item => item.id === s.id ? { ...item, credits } : item);
    }
    const evaluated = rows.filter(r => r.gradePoint !== '' && Number(r.credits) > 0);
    const credits = evaluated.reduce((sum, r) => sum + Number(r.credits), 0);
    const sgpa = credits > 0 ? Math.round(evaluated.reduce((sum, r) => sum + Number(r.credits) * Number(r.gradePoint), 0) / credits * 100) / 100 : 0;
    const failed = evaluated.filter(r => Number(r.gradePoint) === 0);
    plan.calculatedSgpa = sgpa;
    plan.semesters = plan.semesters.map(s => s.id === sem!.id ? { ...s, sgpaSubjects: rows, hiddenSgpaSubjects: s.hiddenSgpaSubjects?.filter(hidden => !imported.has(hidden)), sgpa, totalCredits: rows.reduce((sum, row) => sum + (Number(row.credits) || 0), 0), backlogCount: failed.length, backlogCredits: failed.reduce((sum, r) => sum + Number(r.credits), 0) } : s);
    plan.gradeEntries = plan.gradeEntries.filter(e => e.semesterId !== sem!.id);
    plan.summary.push(`Update ${draft.results.length} results in semester ${semester}; SGPA ${sgpa.toFixed(2)} calculated from ${evaluated.length} entered subject results.`);
    if (draft.reportedSgpa != null && Math.abs(draft.reportedSgpa - sgpa) > 0.02) plan.summary.push(`Document reports SGPA ${draft.reportedSgpa}; reviewed rows calculate ${sgpa}. Check credits and grade points.`);
  }
  for (const row of draft.assignments) {
    const s = subject(row.subject);
    need(row.title && validDate(row.date), 'Assignments need a title and a valid YYYY-MM-DD due date.');
    const existingTask = plan.assignments.find(a => a.subjectId === s.id && key(a.title) === key(row.title) && a.dueDate === row.date);
    if (existingTask) {
      plan.assignments = plan.assignments.map(a => a.id === existingTask.id ? { ...a, notes: row.notes || a.notes, priority: row.priority || a.priority } : a);
      if ((row.notes && row.notes !== existingTask.notes) || (row.priority && row.priority !== existingTask.priority)) plan.summary.push(`Update available notes and priority for ${row.title}; preserve completion status.`);
      continue;
    }
    plan.assignments.push({ id: id(), subjectId: s.id, title: row.title, dueDate: row.date, notes: row.notes, priority: row.priority || 'medium', status: 'pending', createdAt: new Date() }); tasks++;
  }
  for (const row of draft.exams) {
    const s = subject(row.subject);
    need(validDate(row.date) && (!row.start || validTime(row.start)), 'Exams need a valid date and optional HH:MM start time.');
    const existingExam = plan.exams.find(e => e.subjectId === s.id && e.date === row.date && e.type === row.type);
    if (existingExam) {
      const updated = { ...existingExam, startTime: row.start || existingExam.startTime, room: row.room || existingExam.room, notes: row.notes || existingExam.notes, syllabus: row.syllabus || existingExam.syllabus };
      plan.exams = plan.exams.map(e => e.id === existingExam.id ? updated : e);
      if (updated.startTime !== existingExam.startTime || updated.room !== existingExam.room || updated.notes !== existingExam.notes || updated.syllabus !== existingExam.syllabus) plan.summary.push(`Update available exam details for ${s.name} on ${row.date}; retain the saved exam ID.`);
      continue;
    }
    plan.exams.push({ id: id(), subjectId: s.id, date: row.date, startTime: row.start || undefined, room: row.room, notes: row.notes, syllabus: row.syllabus, type: row.type }); exams++;
  }
  for (const change of draft.changes.filter(c => c.target === 'calendar' && c.operation === 'update')) {
    const day = (new Date(`${change.id}T12:00:00Z`).getUTCDay() + 6) % 7;
    const entries = plan.entries.filter(e => activeIds.has(e.subjectId) && (e.date ? e.date === change.id : e.dayOfWeek === day));
    for (const entry of entries) {
      const matches = (r: AttendanceRecord) => r.subjectId === entry.subjectId && r.date === change.id && (r.timetableEntryId === entry.id || !r.timetableEntryId);
      need(!plan.records.some(r => matches(r) && !r.timetableEntryId) || entries.filter(e => e.subjectId === entry.subjectId).length === 1, 'Review legacy attendance in Attendance before changing this calendar day.');
      const existing = plan.records.find(matches);
      plan.records = plan.records.filter(r => !matches(r));
      plan.records.push({ id: existing?.id ?? id(), subjectId: entry.subjectId, date: change.id, timetableEntryId: entry.id, status: change.value === 'holiday' ? 'holiday' : 'cancelled', markedAt: new Date() });
    }
    plan.summary.push(`Mark ${entries.length} scheduled classes ${change.value === 'holiday' ? 'holiday' : 'cancelled'} on ${change.id}. Clearing the calendar event later preserves these attendance records until explicitly changed.`);
  }
  applyAttendanceRanges(draft.attendanceRanges, plan, semester, id);
  for (const row of draft.attendance) {
    const s = subject(row.subject);
    need(validDate(row.date), 'Attendance needs a valid YYYY-MM-DD date.');
    need(!plan.events?.[row.date], 'This date is a holiday or exam day. Clear its calendar event before marking attendance.');
    need(inSemester(row.date, plan), 'Attendance date is outside the semester dates.');
    const date = new Date(`${row.date}T12:00:00`);
    const day = (date.getDay() + 6) % 7;
    const entries = plan.entries.filter(e => e.subjectId === s.id && (e.date ? e.date === row.date : e.dayOfWeek === day) && (!row.start || e.startTime === row.start));
    need(entries.length === 1, `Choose one scheduled ${s.name} class on ${row.date}; enter its start time when there are several.`);
    const entry = entries[0];
    need(!plan.records.some(r => r.subjectId === s.id && r.date === row.date && !r.timetableEntryId) || plan.entries.filter(e => e.subjectId === s.id && (e.date ? e.date === row.date : e.dayOfWeek === day)).length === 1, 'Review legacy attendance in Attendance before selecting one of several classes.');
    const existing = plan.records.find(r => r.subjectId === s.id && r.date === row.date && (r.timetableEntryId === entry.id || !r.timetableEntryId));
    if (existing) plan.records = plan.records.map(r => r.id === existing.id ? { ...r, timetableEntryId: entry.id, status: row.status, note: row.note || r.note, markedAt: new Date() } : r);
    else plan.records.push({ id: id(), subjectId: s.id, date: row.date, timetableEntryId: entry.id, status: row.status, note: row.note || undefined, markedAt: new Date() });
    attendance++;
  }
  if (updatedSubjects) plan.summary.push(`Update ${updatedSubjects} matching subjects using the reviewed full names, codes and available subject details.`);
  if (newSubjects) plan.summary.push(`Add ${newSubjects} subjects; reuse matching subjects in this semester.`);
  if (draft.classes.length) plan.summary.push(`Add ${newClasses} weekly or dated classes; reuse matching classes and update supplied details.`);
  if (draft.assignments.length) plan.summary.push(`Add ${tasks} assignments; reuse matching assignments and update supplied details. No notification is scheduled.`);
  if (draft.exams.length) plan.summary.push(`Add ${exams} exam entries; reuse matching exams and update supplied details.`);
  if (attendance) plan.summary.push(`Mark ${attendance} scheduled attendance records.`);
  if (!plan.summary.length) plan.summary.push('These subjects already exist; no new subjects to add.');
  return plan;
}

// Ollama can constrain decoding to this shape; app validation still checks facts and relationships.
const stringField = { type: 'string' };
const nullableNumber = { type: ['number', 'null'] };
const objectSchema = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const arraySchema = (properties: Record<string, unknown>) => ({ type: 'array', items: objectSchema(properties) });
export const academicActionSchema = objectSchema({
  changes: arraySchema({ target: { type: 'string', enum: ['class', 'subject', 'assignment', 'exam', 'profile', 'settings', 'calendar'] }, id: stringField, operation: { type: 'string', enum: ['update', 'delete'] }, field: stringField, value: stringField }),
  attendanceRanges: arraySchema({ subject: stringField, from: stringField, to: stringField, start: stringField, day: nullableNumber, status: { type: 'string', enum: ['present', 'absent', 'cancelled', 'holiday', 'unmarked'] } }),
  timeColumns: arraySchema({ start: stringField, end: stringField }),
  message: stringField, semester: nullableNumber, reportedSgpa: nullableNumber, reportedCredits: nullableNumber,
  subjects: arraySchema({ typeEvidence: stringField, id: stringField, name: stringField, code: stringField, faculty: stringField, description: stringField, room: stringField, shortName: stringField, type: { type: 'string', enum: ['', 'theory', 'lab'] }, color: stringField, icon: stringField, credits: nullableNumber }),
  classes: arraySchema({ sourceLabel: stringField, subject: stringField, day: nullableNumber, date: stringField, start: stringField, end: stringField, room: stringField, color: stringField, type: { type: 'string', enum: ['', 'lecture', 'lab'] } }),
  results: arraySchema({ code: stringField, subject: stringField, credits: nullableNumber, marks: nullableNumber, maxMarks: nullableNumber, grade: stringField, gradePoint: nullableNumber }),
  assignments: arraySchema({ subject: stringField, title: stringField, date: stringField, notes: stringField, priority: { type: 'string', enum: ['', 'low', 'medium', 'high'] } }),
  exams: arraySchema({ subject: stringField, date: stringField, start: stringField, room: stringField, notes: stringField, syllabus: stringField, type: { type: 'string', enum: ['midsem', 'endsem', 'quiz', 'viva', 'practical', 'assignment'] } }),
  attendance: arraySchema({ subject: stringField, date: stringField, start: stringField, note: stringField, status: { type: 'string', enum: ['present', 'absent', 'cancelled', 'holiday'] } }),
});

// A fixed allowlist keeps model-generated field names away from store methods and credentials.
export const editableFields = {
  class: ['dayOfWeek', 'date', 'startTime', 'endTime', 'room', 'type'],
  subject: ['name', 'code', 'shortName', 'faculty', 'description', 'room', 'icon', 'credits', 'attendanceTarget', 'type', 'color'],
  assignment: ['title', 'dueDate', 'notes', 'priority', 'status'],
  exam: ['date', 'startTime', 'room', 'type', 'notes', 'syllabus'],
  profile: ['name', 'enrollmentNumber', 'college', 'branch', 'section', 'academicYear', 'currentSemester', 'semesterStartDate', 'semesterEndDate', 'totalSemesters', 'totalCredits'],
  settings: ['theme', 'accentColor', 'attendanceTarget', 'weekStartsOn', 'collegeStartTime', 'collegeEndTime', 'hapticFeedback', 'targetCGPA', 'targetSemester', 'goalMotivation'],
  calendar: ['type'],
} as const;

function classDatesOverlap(a: { dayOfWeek: number; date?: string }, b: { dayOfWeek: number; date?: string }) {
  if (a.date && b.date) return a.date === b.date;
  const day = (entry: { dayOfWeek: number; date?: string }) => entry.date ? (new Date(`${entry.date}T12:00:00Z`).getUTCDay() + 6) % 7 : entry.dayOfWeek;
  return day(a) === day(b);
}
function inSemester(date: string, plan: ActionSnapshot) {
  const start = plan.profile?.semesterStartDate ?? plan.semesterStartDate;
  const end = plan.profile?.semesterEndDate ?? plan.semesterEndDate;
  return (!start || date >= start) && (!end || date <= end);
}
function fieldValue(field: string, value: string): string | number | boolean {
  const enums: Record<string, string[]> = {
    theme: ['light', 'dark', 'system'], priority: ['low', 'medium', 'high'], status: ['pending', 'completed', 'overdue'],
  };
  if (enums[field]) return choice(value, enums[field]);
  if (field === 'hapticFeedback') { need(value === 'true' || value === 'false', 'Use true or false for haptic feedback.'); return value === 'true'; }
  const limits: Record<string, [number, number, boolean?]> = {
    dayOfWeek: [0, 6, true], credits: [0, 30], attendanceTarget: [1, 100], currentSemester: [1, 20, true], totalSemesters: [1, 20, true], totalCredits: [0, 1000],
    weekStartsOn: [0, 1, true], targetCGPA: [0, 10], targetSemester: [1, 20, true],
  };
  if (limits[field]) {
    const [min, max, integer] = limits[field]; const n = Number(value);
    need(value.trim() !== '' && Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n)), `${field} must be ${min}–${max}${integer ? ' (whole number)' : ''}.`);
    return n;
  }
  if (['date', 'dueDate', 'semesterStartDate', 'semesterEndDate'].includes(field)) need(validDate(value) || (field === 'date' && value === ''), 'Use a valid YYYY-MM-DD date.');
  if (['startTime', 'endTime', 'collegeStartTime', 'collegeEndTime'].includes(field)) need(validTime(value), 'Use HH:MM in 24-hour time.');
  if (['color', 'accentColor'].includes(field)) need(/^#[a-f0-9]{6}$/i.test(value), 'Use a six-digit hex color.');
  if (['name', 'title', 'shortName'].includes(field)) need(value.trim(), `${field} cannot be empty.`);
  return value;
}

function applyRecordChanges(changes: ActionChange[], plan: ActionPlan, semester: number) {
  const subjectIds = new Set(plan.subjects.filter(s => s.semesterId === String(semester)).map(s => s.id));
  const touchedClasses = new Set<string>();
  const deleted = new Set<string>();
  for (const change of changes) {
    const { target, operation, field, value } = change;
    need(!deleted.has(`${target}:${change.id}`), 'An item cannot be edited after it is deleted in the same request.');
    if (target === 'calendar') {
      need(validDate(change.id), 'Calendar changes need a YYYY-MM-DD date as the ID.');
      if (operation === 'delete') { delete plan.events![change.id]; plan.summary.push(`Clear calendar event on ${change.id}.`); }
      else {
        need(field === 'type', 'Calendar changes support only the type field.');
        plan.events![change.id] = choice(value, ['holiday', 'exam']);
        plan.summary.push(`Set ${change.id} as ${value}; scheduled classes on this date will be hidden.`);
      }
      continue;
    }
    if (target === 'profile' || target === 'settings') {
      need(operation === 'update', `Deleting ${target} is not supported through chat.`);
      need((editableFields[target] as readonly string[]).includes(field), `Unsupported ${target} field: ${field}.`);
      if (target === 'profile') need(plan.profile, 'Create a profile before editing it through chat.');
      const values = (target === 'profile' ? plan.profile : plan.preferences) as Record<string, unknown>;
      const next = fieldValue(field, value);
      plan.summary.push(`${target === 'profile' ? 'Profile' : 'Settings'} · ${field}: ${String(values[field] ?? 'unset')} → ${String(next)}.`);
      values[field] = next;
      continue;
    }
    const collection = target === 'class' ? plan.entries : target === 'subject' ? plan.subjects : target === 'assignment' ? plan.assignments : plan.exams;
    const item = collection.find(row => row.id === change.id);
    need(item, `The selected ${target} “${change.id}” no longer exists or could not be matched. Prepare the request again or choose the correct subject in this review.`);
    const subjectId = target === 'subject' ? item.id : (item as TimetableEntry | Assignment | Exam).subjectId;
    need(subjectIds.has(subjectId), `The selected ${target} belongs to another semester.`);
    const name = plan.subjects.find(s => s.id === subjectId)?.name ?? target;
    if (operation === 'delete') {
      if (target === 'subject') {
        need(!plan.gradeEntries.some(e => e.subjectId === item.id) && !plan.semesters.some(s => s.sgpaSubjects?.some(r => r.id === item.id)), 'This subject has results. Remove its results in the academic screen before deleting it.');
        const counts = [plan.entries, plan.assignments, plan.exams, plan.records].map(rows => rows.filter(r => r.subjectId === item.id).length);
        plan.subjects = plan.subjects.filter(s => s.id !== item.id);
        plan.entries = plan.entries.filter(e => e.subjectId !== item.id);
        plan.assignments = plan.assignments.filter(a => a.subjectId !== item.id);
        plan.exams = plan.exams.filter(e => e.subjectId !== item.id);
        plan.records = plan.records.filter(r => r.subjectId !== item.id);
        plan.summary.push(`Delete ${name} and its ${counts[0]} classes, ${counts[1]} assignments, ${counts[2]} exams and ${counts[3]} attendance records.`);
      } else {
        if (target === 'class') plan.entries = plan.entries.filter(e => e.id !== item.id);
        if (target === 'assignment') plan.assignments = plan.assignments.filter(a => a.id !== item.id);
        if (target === 'exam') plan.exams = plan.exams.filter(e => e.id !== item.id);
        plan.summary.push(`Delete ${name} ${target} ${'title' in item ? item.title : 'startTime' in item ? `${'date' in item && item.date ? item.date : `weekday ${'dayOfWeek' in item ? item.dayOfWeek : ''}`} ${item.startTime ?? ''}` : ''}. Existing attendance history is retained.`);
      }
      deleted.add(`${target}:${change.id}`);
      continue;
    }
    need((editableFields[target] as readonly string[]).includes(field), `Unsupported ${target} field: ${field}.`);
    let next = fieldValue(field, value);
    if (field === 'type') next = target === 'class' ? choice(value, ['lecture', 'lab']) : target === 'subject' ? choice(value, ['theory', 'lab']) : choice(value, ['midsem', 'endsem', 'quiz', 'viva', 'practical', 'assignment']);
    const updated = { ...item, [field]: next };
    if (target === 'class') { plan.entries = plan.entries.map(e => e.id === item.id ? updated as TimetableEntry : e); touchedClasses.add(item.id); }
    if (target === 'subject') {
      // Result credits must be changed through the results flow so GPA stays consistent.
      if (field === 'credits') need(!plan.gradeEntries.some(e => e.subjectId === item.id) && !plan.semesters.some(s => s.sgpaSubjects?.some(r => r.id === item.id)), 'Update credits through semester results for this graded subject.');
      plan.subjects = plan.subjects.map(s => s.id === item.id ? updated as Subject : s);
    }
    if (target === 'assignment') {
      const assignment = updated as Assignment;
      if (field === 'status') assignment.completedAt = value === 'completed' ? new Date() : undefined;
      plan.assignments = plan.assignments.map(a => a.id === item.id ? assignment : a);
    }
    if (target === 'exam') plan.exams = plan.exams.map(e => e.id === item.id ? updated as Exam : e);
    plan.summary.push(`${name} ${target} · ${field}: ${String((item as unknown as Record<string, unknown>)[field] ?? 'unset')} → ${String(next)}.`);
  }
  for (const entry of plan.entries.filter(e => touchedClasses.has(e.id))) {
    if (entry.date) {
      const day = (new Date(`${entry.date}T12:00:00Z`).getUTCDay() + 6) % 7;
      entry.dayOfWeek = day as DayOfWeek;
    }
    need(validTime(entry.startTime) && validTime(entry.endTime) && entry.endTime > entry.startTime, 'Class end time must be after its start.');
    need(!plan.entries.some(e => e.id !== entry.id && subjectIds.has(e.subjectId) && classDatesOverlap(e, entry) && e.startTime < entry.endTime && e.endTime > entry.startTime), 'The rescheduled class overlaps another class.');
  }
  if (plan.profile?.semesterStartDate && plan.profile.semesterEndDate) need(plan.profile.semesterStartDate <= plan.profile.semesterEndDate, 'Semester end must be on or after its start.');
  if (plan.preferences?.collegeStartTime && plan.preferences.collegeEndTime) need(String(plan.preferences.collegeStartTime) < String(plan.preferences.collegeEndTime), 'College end time must be after its start.');
}

function applyAttendanceRanges(ranges: AttendanceRange[], plan: ActionPlan, semester: number, id: () => string) {
  let affected = 0;
  for (const row of ranges) {
    need(validDate(row.from) && validDate(row.to) && row.to >= row.from, 'Attendance range needs valid start/end dates, in order.');
    const from = new Date(`${row.from}T12:00:00Z`); const to = new Date(`${row.to}T12:00:00Z`);
    need((to.getTime() - from.getTime()) / 86400000 < 366, 'Limit attendance changes to one year per request.');
    need(!row.start || validTime(row.start), 'Attendance start time must use HH:MM.');
    need(row.day == null || Number.isInteger(row.day), 'Attendance weekday must be a whole number.');
    const subjects = plan.subjects.filter(s => s.semesterId === String(semester) && (!row.subject || key(s.name) === key(row.subject) || key(s.code) === key(row.subject)));
    need(subjects.length && (!row.subject || subjects.length === 1), 'Choose an unambiguous subject for the attendance range, or leave subject blank for all subjects in this semester.');
    const subjectIds = new Set(subjects.map(s => s.id)); let count = 0;
    for (const date = new Date(from); date <= to; date.setUTCDate(date.getUTCDate() + 1)) {
      const dateStr = date.toISOString().slice(0, 10); const day = (date.getUTCDay() + 6) % 7;
      if (!inSemester(dateStr, plan) || plan.events?.[dateStr] || (row.day != null && row.day !== day)) continue;
      const entries = plan.entries.filter(e => subjectIds.has(e.subjectId) && (e.date ? e.date === dateStr : e.dayOfWeek === day) && (!row.start || e.startTime === row.start));
      for (const entry of entries) {
        need(++affected <= 2000, 'Too many affected classes. Use a smaller attendance range.');
        const legacy = plan.records.filter(r => r.subjectId === entry.subjectId && r.date === dateStr && !r.timetableEntryId);
        need(!legacy.length || plan.entries.filter(e => e.subjectId === entry.subjectId && (e.date ? e.date === dateStr : e.dayOfWeek === day)).length === 1, 'This day has legacy attendance without a class ID. Review it in Attendance before applying a bulk change.');
        const matches = (r: AttendanceRecord) => r.subjectId === entry.subjectId && r.date === dateStr && (r.timetableEntryId === entry.id || !r.timetableEntryId);
        const existing = plan.records.find(matches);
        const previous = existing?.status ?? 'unmarked';
        plan.records = plan.records.filter(r => !matches(r));
        if (row.status !== 'unmarked') plan.records.push({ id: existing?.id ?? id(), subjectId: entry.subjectId, date: dateStr, timetableEntryId: entry.id, status: row.status, markedAt: new Date() });
        plan.summary.push(`${dateStr} ${entry.startTime} · ${plan.subjects.find(s => s.id === entry.subjectId)?.name}: ${previous} → ${row.status}.`);
        count++;
      }
    }
    need(count > 0, 'No scheduled classes match this attendance range. Check the subject, dates, semester, holidays and start time.');
    plan.summary.push(`Review ${count} scheduled classes from ${row.from} to ${row.to}; ${row.status === 'unmarked' ? 'clear their explicit attendance' : `mark ${row.status}`}. Holidays, exam days and dates outside the semester are skipped.`);
  }
}

/** Reconcile subject imports and field edits into one card per saved subject, without fuzzy matching. */
export function normalizeSubjectActions(draft: AcademicActionDraft, snapshot: ActionSnapshot, semester: number): AcademicActionDraft {
  const saved = snapshot.subjects.filter(s => s.semesterId === String(semester));
  const resolve = (reference: string) => {
    if (!reference) return undefined;
    const exactId = saved.find(s => s.id === reference);
    if (exactId) return exactId;
    const exact = saved.filter(s => [s.name, s.code, s.shortName].some(value => value && key(value) === key(reference)));
    const matches = exact.length ? exact : saved.filter(s => courseMatches(s, reference));
    need(matches.length <= 1, `More than one saved subject matches “${reference}”. Choose a unique subject code.`);
    return matches[0];
  };
  const rows: ActionSubject[] = [];
  const meaningful = (value: unknown) => value !== '' && value !== null && value !== undefined;
  const merge = (row: ActionSubject, existing?: Subject) => {
    const target = rows.find(item => existing ? item.id === existing.id : !item.id && ((row.code && key(item.code) === key(row.code)) || key(item.name) === key(row.name)));
    if (!target) { rows.push({ ...row, id: existing?.id ?? row.id }); return; }
    for (const [field, value] of Object.entries(row)) {
      if (field === 'id' || !meaningful(value)) continue;
      const previous = (target as unknown as Record<string, unknown>)[field];
      if (field === 'name' && typeof previous === 'string' && typeof value === 'string') {
        // Identity was already matched by saved ID or course code. Keep the fuller title.
        const title = (name: string) => key(name).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
        const before = title(previous), after = title(value);
        if (before === after || before.startsWith(`${after} `)) continue;
        if (after.startsWith(`${before} `)) { target.name = value; continue; }
      }
      need(!meaningful(previous) || previous === value, `Conflicting ${field} values for ${existing?.name ?? row.name}. Keep one reviewed value.`);
      (target as unknown as Record<string, unknown>)[field] = value;
    }
  };
  for (const row of draft.subjects) {
    // An explicit ID must be a real ID, not a model-invented alias.
    const existing = row.id ? saved.find(s => s.id === row.id) : resolve(row.code) ?? resolve(row.name);
    need(!row.id || existing, `No saved subject matches “${row.name || row.id}” in semester ${semester}. Prepare the request again.`);
    merge(row, existing);
  }
  const fields = new Set(['name', 'code', 'faculty', 'credits', 'type', 'room', 'description', 'shortName', 'color', 'icon']);
  const remaining: ActionChange[] = [];
  for (const change of draft.changes) {
    const existing = change.target === 'subject' ? resolve(change.id) : undefined;
    if (change.target !== 'subject' || change.operation !== 'update' || !fields.has(change.field) || !change.value || !existing) {
      remaining.push(existing ? { ...change, id: existing.id } : change);
      continue;
    }
    if ((change.field === 'name' || change.field === 'code') && change.value !== existing[change.field]) {
      const duplicate = rows.some(row => row.id === existing.id && row[change.field as 'name' | 'code'] === change.value);
      const shortens = change.field === 'name' ? key(existing.name).startsWith(`${key(change.value)} `) : existing.code.startsWith(change.value) && change.value.length < existing.code.length;
      if (!duplicate || shortens) { remaining.push({ ...change, id: existing.id }); continue; }
    }
    const empty = parseActionDraft(JSON.stringify({ subjects: [{ id: existing.id }] })).subjects[0];
    const value = change.field === 'credits' ? fieldValue('credits', change.value) : change.value;
    merge({ ...empty, [change.field]: value }, existing);
  }
  // Only exact course aliases establish a related lab; a room named Lab is not evidence.
  const alias = (value: string) => key(value).replace(/[^a-z0-9]/g, '');
  const palette = ['#10B981', '#6366F1', '#3B82F6', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#EF4444'];
  const colorsInUse = [...saved.map(subject => subject.color), ...rows.filter(row => !row.id && row.color).map(row => row.color)];
  const nextColor = () => {
    const color = palette.reduce((best, candidate) => colorsInUse.filter(value => value?.toLowerCase() === candidate.toLowerCase()).length < colorsInUse.filter(value => value?.toLowerCase() === best.toLowerCase()).length ? candidate : best);
    colorsInUse.push(color);
    return color;
  };
  const hydrated = rows.map(row => {
    const existing = row.id ? saved.find(s => s.id === row.id) : undefined;
    const names = [row.name, row.code, row.shortName, existing?.name || '', existing?.code || '', existing?.shortName || ''].filter(Boolean);
    const aliases = new Set(names.map(alias));
    for (const name of names) {
      const words = name.match(/[a-z0-9]+/gi) || [];
      if (words.length > 1) aliases.add(alias(words.map(word => word[0]).join('')));
    }
    const hasLab = draft.classes.some(entry => {
      const labLabel = /\b(lab|laboratory|practical)\b/i.test(entry.subject);
      if (entry.type !== 'lab' && !labLabel) return false;
      const course = entry.subject.replace(/\b(lab|laboratory|practical)\b/gi, '').trim();
      return aliases.has(alias(course));
    });
    const inferred = { ...row, type: row.type || (hasLab ? 'lab' as const : '') };
    if (!existing) return { ...inferred, color: row.color || nextColor() };
    return { ...inferred, name: row.name || existing.name, code: row.code || existing.code, faculty: row.faculty || existing.faculty,
      credits: row.credits ?? existing.credits, type: inferred.type || (existing.type === 'elective' ? '' : existing.type), room: row.room || existing.room,
      description: row.description || existing.description || '', shortName: row.shortName || existing.shortName,
      color: row.color || existing.color, icon: row.icon || (typeof existing.icon === 'string' ? existing.icon : '') };
  });
  const courses = [...hydrated, ...saved];
  const courseKey = (value: string) => key(value).replace(/[^a-z0-9]/g, '');
  const classes = draft.classes.map(entry => {
    if (entry.mappingConfirmed) return entry;
    const source = entry.sourceLabel || entry.mappedFrom || entry.subject;
    const labLabel = /\b(lab|laboratory|practical)\b/i.test(source);
    if (!labLabel) {
      const references = [entry.subject, entry.sourceLabel || ''].filter(reference => reference && !nonCourseLabel(reference));
      const exact = courses.filter(course => references.some(reference => [course.name, course.code, course.shortName].some(value => value && courseAlias(value) === courseAlias(reference))));
      const matches = exact.length ? exact : courses.filter(course => references.some(reference => courseMatches(course, reference)));
      const distinct = new Set(matches.map(course => courseAlias(course.code || course.name)));
      return distinct.size === 1 ? { ...entry, subject: matches[0].name } : entry;
    }
    const label = courseKey(source.replace(/\b(lab|laboratory|practical)\b/gi, ''));
    const matches = courses.filter(course => {
      const names = [course.name, course.code, course.shortName].filter(Boolean);
      return names.some(name => {
        const words = name.match(/[a-z0-9]+/gi) || [];
        return courseKey(name) === label || (words.length > 1 && courseKey(words.map(word => word[0]).join('')) === label);
      });
    });
    const distinct = [...new Set(matches.map(course => courseKey(course.code || course.name)))];
    return { ...entry, subject: distinct.length === 1 ? matches[0].name : entry.subject, mappedFrom: distinct.length === 1 && courseKey(source) !== courseKey(matches[0].name) ? source : entry.mappedFrom, mappingConfirmed: false, type: 'lab' as const };
  });
  return parseActionDraft(JSON.stringify({ ...draft, subjects: hydrated, classes, changes: remaining }));
}

// A valid parsed proposal can always be reviewed, even when its edits conflict.
// The strict planner still blocks saving until the user resolves those conflicts.
export function subjectActionsForReview(draft: AcademicActionDraft, snapshot: ActionSnapshot, semester: number): AcademicActionDraft {
  const compact = (value: string) => key(value).replace(/[^a-z0-9]/g, '');
  const subjects = draft.subjects.map(row => {
    const names = [row.name, row.code, row.shortName].filter(Boolean);
    const aliases = new Set(names.map(compact));
    for (const name of names) {
      const words = name.match(/[a-z0-9]+/gi) || [];
      if (words.length > 1) aliases.add(compact(words.map(word => word[0]).join('')));
    }
    const evidence = row.typeEvidence || '';
    const labLabels = [evidence, ...draft.classes.filter(entry => entry.type === 'lab' || /\b(lab|laboratory|practical)\b/i.test(entry.subject)).map(entry => entry.subject)];
    const hasLab = labLabels.some(label => {
      if (!/\b(lab|laboratory|practical)\b/i.test(label) && label === evidence) return false;
      return aliases.has(compact(label.replace(/\b(lab|laboratory|practical)\b/gi, '')));
    });
    // Apply evidence before review only, so a later manual selection is never overridden.
    return { ...row, type: hasLab ? 'lab' as const : evidence ? row.type : '' as const };
  });
  const proposal = { ...draft, subjects };
  try {
    const normalized = normalizeSubjectActions(proposal, snapshot, semester);
    return { ...normalized, subjects: normalized.subjects.map(row => ({ ...row,
      type: row.type === 'theory' && !row.typeEvidence ? '' : row.type
    })) };
  } catch { return proposal; }
}

export function classReviewIssues(draft: AcademicActionDraft, snapshot: ActionSnapshot, semester: number, replaceWeekly = false, replaceDated = false): string[][] {
  try { draft = normalizeSubjectActions(draft, snapshot, semester); } catch { /* Keep malformed proposals editable. */ }
  const savedSubjects = snapshot.subjects.filter(subject => subject.semesterId === String(semester));
  return draft.classes.map((row, index) => {
    const issues: string[] = [];
    if (row.mappedFrom && !row.mappingConfirmed) issues.push(`Confirm whether ${row.mappedFrom} belongs to ${row.subject}.`);
    const savedMatches = savedSubjects.filter(subject => subject.id === row.subject || courseMatches(subject, row.subject));
    const savedSubject = savedMatches.length === 1 ? savedMatches[0] : undefined;
    const proposedSubject = !nonCourseLabel(row.subject) && draft.subjects.some(subject => courseMatches(subject, row.subject));
    if (!row.subject || (!savedSubject && !proposedSubject)) issues.push('Choose an existing subject or add it in Subjects below.');
    if (row.date ? !validDate(row.date) : row.day == null || !Number.isInteger(row.day) || row.day < 0 || row.day > 6) issues.push('Choose a weekday or enter a valid date.');
    if (!validTime(row.start) || !validTime(row.end) || row.end <= row.start) issues.push('Set valid start/end times; end must be after start.');
    const opening = String(snapshot.preferences?.collegeStartTime ?? '');
    const closing = String(snapshot.preferences?.collegeEndTime ?? '');
    if (validTime(opening) && validTime(closing) && opening < closing && validTime(row.start) && validTime(row.end) && (row.start < opening || row.end > closing)) issues.push(`Time is outside your configured college hours (${opening}–${closing}). Check AM/PM against the source; keep it only if intentional.`);
    const entry = { dayOfWeek: row.day ?? -1, date: row.date || undefined };
    const overlaps = (other: { dayOfWeek: number; date?: string; startTime: string; endTime: string }) => validTime(row.start) && validTime(row.end) && classDatesOverlap(entry, other) && row.start < other.endTime && row.end > other.startTime;
    draft.classes.forEach((other, otherIndex) => {
      if (otherIndex !== index && overlaps({ dayOfWeek: other.day ?? -1, date: other.date || undefined, startTime: other.start, endTime: other.end })) issues.push(`Overlaps proposed class ${otherIndex + 1}: ${other.subject}.`);
    });
    for (const other of snapshot.entries) {
      if (!savedSubjects.some(subject => subject.id === other.subjectId) || (replaceWeekly && (replaceDated || !other.date))) continue;
      if (savedSubject?.id === other.subjectId && row.start === other.startTime && row.end === other.endTime && (row.date || '') === (other.date || '') && row.day === other.dayOfWeek) continue;
      if (overlaps(other)) issues.push(`Overlaps saved class: ${savedSubjects.find(subject => subject.id === other.subjectId)?.name || 'class'} ${other.startTime}–${other.endTime}.`);
    }
    return issues;
  });
}

// Apply only formatting corrections whose meaning is explicit; never infer AM/PM.
export function cleanTimetableProposal(draft: AcademicActionDraft): AcademicActionDraft {
  const time = (raw: string) => {
    const value = raw.trim();
    const match = /^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/i.exec(value);
    if (!match) return value;
    let hour = Number(match[1]); const minute = Number(match[2]);
    if (minute > 59 || hour > (match[3] ? 12 : 23) || (match[3] && hour < 1)) return value;
    if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    return `${String(hour).padStart(2, '0')}:${match[2]}`;
  };
  const headers = resolveTimetableHeaders(draft.timeColumns ?? []);
  const classes: ActionClass[] = [];
  for (const entry of draft.classes) {
    let row = { ...entry, start: time(entry.start), end: time(entry.end) };
    if (headers) {
      const key = (raw: string) => time(raw).replace(/^0/, '');
      const pairs = new Map<string, { start: string; end: string }>();
      headers.forEach((start, first) => headers.forEach((end, last) => {
        if (last < first) return;
        const startMatches = row.start === start.start || (!/am|pm/i.test(entry.start) && key(row.start) === key(start.rawStart));
        const endMatches = row.end === end.end || (!/am|pm/i.test(entry.end) && key(row.end) === key(end.rawEnd));
        if (startMatches && endMatches) pairs.set(`${start.start}-${end.end}`, { start: start.start, end: end.end });
      }));
      if (pairs.size === 1) row = { ...row, ...Array.from(pairs.values())[0] };
    }
    const duplicate = classes.find(other => key(other.subject) === key(row.subject) && other.day === row.day && other.date === row.date && other.start === row.start && other.end === row.end && other.type === row.type && (!other.room || !row.room || key(other.room) === key(row.room)) && (!other.color || !row.color || other.color === row.color));
    if (duplicate) { duplicate.room ||= row.room; duplicate.color ||= row.color; }
    else classes.push(row);
  }
  return { ...draft, classes };
}

/** Resolve ambiguous 12-hour headers only when the entire ordered sequence has one same-day interpretation. */
export function resolveTimetableHeaders(columns: { start: string; end: string }[]): { start: string; end: string; rawStart: string; rawEnd: string }[] | null {
  if (!columns.length || columns.length > 40) return null;
  const candidates = (raw: string): number[] => {
    const match = /^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/i.exec(raw.trim());
    if (!match) return [];
    const hour = Number(match[1]), minute = Number(match[2]);
    if (hour > 23 || minute > 59 || (match[3] && (hour < 1 || hour > 12))) return [];
    if (match[3]) return [(hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + minute];
    if (hour === 0 || hour > 12) return [hour * 60 + minute];
    return [(hour % 12) * 60 + minute, (hour % 12 + 12) * 60 + minute];
  };
  let solutions: { start: number; end: number }[][] = [[]];
  for (const column of columns) {
    const next: typeof solutions = [];
    for (const solution of solutions) for (const start of candidates(column.start)) for (const end of candidates(column.end)) {
      if (start < (solution[solution.length - 1]?.end ?? 0) || end <= start || end - start >= 720) continue;
      next.push([...solution, { start, end }]);
      if (next.length > 64) return null;
    }
    solutions = next;
    if (!solutions.length) return null;
  }
  if (solutions.length !== 1) return null;
  const format = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  return solutions[0].map((slot, index) => ({ start: format(slot.start), end: format(slot.end), rawStart: columns[index].start, rawEnd: columns[index].end }));
}

/** Explicitly requested subject-only imports cannot create schedule/attendance/grade actions. */
export function constrainSubjectImport(query: string, draft: AcademicActionDraft): AcademicActionDraft {
  const subjects = /\b(?:add|import|extract|update|save|create)\s+(?:(?:only|the|my|these|those|all|just)\s+)*(?:subjects?|courses?)\b/i.test(query);
  const combined = /\b(?:and|also)\s+(?:(?:the|my|their)\s+)*(?:timetable|classes|schedule|results|grades|attendance)\b|\b(?:classes|sgpa|cgpa|marksheet|attendance)\b/i.test(query);
  if (!subjects || combined) return draft;
  return { ...draft, classes: [], changes: draft.changes.filter(change => change.target === 'subject'), results: [], reportedSgpa: null, reportedCredits: null, assignments: [], exams: [], attendance: [], attendanceRanges: [] };
}

// A much smaller response shape for marksheets avoids irrelevant schedule/action output.
export const marksheetActionSchema = objectSchema({ message: stringField, semester: nullableNumber, reportedSgpa: nullableNumber, reportedCredits: nullableNumber, results: academicActionSchema.properties.results });
