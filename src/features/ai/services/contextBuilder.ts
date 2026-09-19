import { useAcademicStore } from '@/stores/useAcademicStore';
import { useAttendanceStore } from '@/stores/useAttendanceStore';
import { useSubjectStore } from '@/stores/useSubjectStore';

export function buildAcademicContext() {
  const academicState = useAcademicStore.getState();
  const attendanceState = useAttendanceStore.getState();
  const subjectState = useSubjectStore.getState();

  const currentSemester = academicState.semesters.find(s => s.isCurrent);
  
  // Map subjects to include attendance data
  const subjectsContext = subjectState.subjects.map(subject => {
    const records = attendanceState.records.filter(r => r.subjectId === subject.id);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const total = present + absent;
    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    // Find grades if any
    const gradeEntry = academicState.gradeEntries.find(e => e.subjectId === subject.id && currentSemester && e.semesterId === currentSemester.id);
    
    return {
      name: subject.name,
      credits: subject.credits,
      attendance: {
        present,
        absent,
        totalClasses: total,
        percentage: attendancePercentage,
        target: subject.attendanceTarget || 75
      },
      grade: gradeEntry ? gradeEntry.grade : null,
    };
  });

  return {
    currentSemester: currentSemester ? currentSemester.name : 'Unknown',
    sgpa: currentSemester ? currentSemester.sgpa : null,
    cgpa: academicState.getCGPA(),
    subjects: subjectsContext,
  };
}
