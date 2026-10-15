import { getPastScheduledClasses, calcAttendancePercentage } from '@/lib/attendanceUtils';
import { useAcademicStore, useAttendanceStore, useSubjectStore, useSettingsStore, useProfileStore, useTimetableStore } from '@/stores';

export function buildAcademicContext() {
  const academic = useAcademicStore.getState();
  const attendance = useAttendanceStore.getState();
  const settings = useSettingsStore.getState();
  const profile = useProfileStore.getState().profile;
  const timetable = useTimetableStore.getState();
  const semesterNumber = profile?.currentSemester || 1;
  const semester = academic.semesters.find(s => s.number === semesterNumber);
  const subjects = useSubjectStore.getState().subjects.filter(s => s.semesterId === String(semesterNumber)).map(subject => {
    const records = attendance.records.filter(r => r.subjectId === subject.id);
    const scheduled = getPastScheduledClasses(subject.id, timetable.entries, timetable.events, profile?.semesterStartDate);
    const assumedPresent = scheduled.filter(s => !records.some(r => r.date === s.dateStr && r.timetableEntryId === s.entryId)).length;
    const present = records.filter(r => r.status === 'present').length + assumedPresent;
    const absent = records.filter(r => r.status === 'absent').length;
    const total = present + absent;
    return {
      name: subject.name, credits: subject.credits,
      attendance: { present, absent, totalClasses: total, percentage: calcAttendancePercentage(present, total), target: subject.attendanceTarget ?? settings.attendanceTarget },
      grade: academic.gradeEntries.find(e => e.subjectId === subject.id && e.semesterId === semester?.id)?.grade ?? null,
    };
  });
  return { currentSemester: semester?.name || `Semester ${semesterNumber}`, sgpa: semester ? academic.getSGPA(semester.id) : null, cgpa: academic.getCGPA(), subjects };
}
