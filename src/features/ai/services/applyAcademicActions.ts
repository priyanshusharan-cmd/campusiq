import { useProfileStore } from '@/stores/useProfileStore';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { useAcademicStore } from '@/stores/useAcademicStore';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { useAssignmentStore } from '@/stores/useAssignmentStore';
import { useExamStore } from '@/stores/useExamStore';
import { useAttendanceStore } from '@/stores/useAttendanceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { generateId } from '@/types';
import { parseActionDraft, planAcademicActions, type AcademicActionDraft, type ActionSnapshot, editableFields } from './actionDraft';

export function actionSnapshot() {
  const academic = useAcademicStore.getState();
  const settings = useSettingsStore.getState();
  const preferences = Object.fromEntries(editableFields.settings.map(field => [field, settings[field]]));
  return { profile: useProfileStore.getState().profile, preferences, events: useTimetableStore.getState().events ?? {}, currentSemester: useProfileStore.getState().profile?.currentSemester ?? 1, subjects: useSubjectStore.getState().subjects, semesters: academic.semesters, gradeEntries: academic.gradeEntries, gradeScheme: academic.gradeScheme,
    entries: useTimetableStore.getState().entries, assignments: useAssignmentStore.getState().assignments, exams: useExamStore.getState().exams, records: useAttendanceStore.getState().records };
}
export function previewAcademicActions(draft: AcademicActionDraft, semester: number, replaceWeekly: boolean, replaceDated = false) {
  let next = 0;
  const snapshot = actionSnapshot();
  return { ...planAcademicActions(parseActionDraft(JSON.stringify(draft)), snapshot, semester, () => `preview-${++next}`, replaceWeekly, replaceDated), snapshotSignature: JSON.stringify(snapshot) };
}
export function applyAcademicActions(draft: AcademicActionDraft, semester: number, replaceWeekly: boolean, expectedSnapshot?: string, replaceDated = false) {
  const before = actionSnapshot();
  if (expectedSnapshot && JSON.stringify(before) !== expectedSnapshot) throw new Error('Your saved data changed while this review was open. Close and reopen the review to check the updated changes.');
  const plan = planAcademicActions(parseActionDraft(JSON.stringify(draft)), before, semester, generateId, replaceWeekly, replaceDated);
  const write = (data: ActionSnapshot) => {
    useSubjectStore.getState().loadSubjects(data.subjects);
    useTimetableStore.getState().loadEntries(data.entries);
    useAcademicStore.getState().loadSemesters(data.semesters);
    useAcademicStore.getState().loadGradeEntries(data.gradeEntries);
    useAssignmentStore.getState().loadAssignments(data.assignments);
    useExamStore.getState().loadExams(data.exams);
    useAttendanceStore.getState().loadRecords(data.records);
    useTimetableStore.setState({ events: data.events ?? {} });
    if (data.profile !== undefined) useProfileStore.setState({ profile: data.profile });
    if (data.preferences) useSettingsStore.setState(data.preferences);
  };
  try { write(plan); } catch (error) { write(before); throw error; }
  return plan.summary.filter(line => !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2} ·/.test(line)).join('\n');
}
