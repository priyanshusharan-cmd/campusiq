import { useAcademicStore } from '@/stores/useAcademicStore';
import { useAttendanceStore } from '@/stores/useAttendanceStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSubjectStore } from '@/stores/useSubjectStore';

export function buildAcademicContext() {
  const academicState = useAcademicStore.getState();
  const attendanceState = useAttendanceStore.getState();
  const subjectState = useSubjectStore.getState();

  const semesterNumber = useProfileStore.getState().profile?.currentSemester;
  const currentSemester = academicState.semesters.find(s => s.number === semesterNumber) ?? academicState.semesters.find(s => s.isCurrent);
  
  // Map subjects to include attendance data
  const subjectsContext = subjectState.subjects.map(subject => {
    const records = attendanceState.records.filter(r => r.subjectId === subject.id);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const total = present + absent;
    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    // Find grades if any
    const semester = academicState.semesters.find(s => String(s.number) === subject.semesterId);
    const gradeEntry = academicState.gradeEntries.find(e => e.subjectId === subject.id && e.semesterId === semester?.id);
    const scorecard = semester?.sgpaSubjects?.find(row => row.id === subject.id);
    
    return {
      name: subject.name,
      credits: subject.credits,
      semester: subject.semesterId,
      attendance: {
        present,
        absent,
        totalClasses: total,
        percentage: attendancePercentage,
        target: subject.attendanceTarget || 75
      },
      grade: gradeEntry ? gradeEntry.grade : null,
      gradePoint: gradeEntry?.gradePoint ?? (scorecard?.gradePoint !== '' && scorecard?.gradePoint != null ? Number(scorecard.gradePoint) : null),
      marksPercent: scorecard?.totalMarks !== '' && scorecard?.totalMarks != null ? Number(scorecard.totalMarks) : null,
    };
  });

  return {
    currentSemester: currentSemester ? currentSemester.name : 'Unknown',
    sgpa: currentSemester ? currentSemester.sgpa : null,
    cgpa: academicState.getCGPA(),
    semesters: academicState.semesters.map(s => ({ number: s.number, name: s.name, sgpa: s.sgpa ?? null, totalCredits: s.totalCredits ?? null })),
    subjects: subjectsContext,
  };
}
