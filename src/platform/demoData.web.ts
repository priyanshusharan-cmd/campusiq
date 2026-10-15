import { format, addDays } from 'date-fns';
import { useProfileStore, useSubjectStore, useAcademicStore, useTimetableStore, useAttendanceStore, useAssignmentStore, useExamStore, useSettingsStore } from '@/stores';
import type { DayOfWeek } from '@/types';

export function loadDemoData() {
  // Never overwrite a visitor's existing work.
  if (useProfileStore.getState().profile || useSubjectStore.getState().subjects.length) return;
  const today = new Date();
  const date = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd');
  useProfileStore.getState().setProfile({ name: 'Alex', college: 'CampusIQ Demo University', branch: 'Computer Science', currentSemester: 4, enrollmentNumber: 'DEMO-2026', semesterStartDate: date(-28), semesterEndDate: date(90), totalSemesters: 8 });
  const academic = useAcademicStore.getState();
  academic.addSemester({ name: 'Semester 3', number: 3, sgpa: 8.6, totalCredits: 20 });
  const semester = academic.addSemester({ name: 'Semester 4', number: 4, isCurrent: true });
  const names = ['Data Structures', 'Computer Networks', 'Engineering Mathematics', 'Database Systems'];
  const subjects = names.map((name, index) => useSubjectStore.getState().addSubject({
    name, code: ['CS401', 'CS402', 'MA401', 'CS403'][index], credits: index === 2 ? 4 : 3,
    semesterId: '4', color: ['#7C5CFC', '#0EA5E9', '#F59E0B', '#10B981'][index],
    components: [
      { id: `demo-cie-${index}`, name: 'Internal assessment', type: 'standalone', maxMarks: 50, weight: 50, earnedMarks: [43, 38, 41, 45][index] },
      { id: `demo-see-${index}`, name: 'Semester exam', type: 'standalone', maxMarks: 50, weight: 50 },
    ],
  }));
  subjects.forEach((subject, i) => academic.addGradeEntry({ semesterId: semester.id, subjectId: subject.id, grade: i % 2 ? 'A' : 'A+', credits: subject.credits }));
  const timetable = useTimetableStore.getState();
  const attendance = useAttendanceStore.getState();
  for (let day = 0; day < 6; day++) {
    subjects.slice(0, 3).forEach((subject, index) => {
      const entry = timetable.addEntry({ subjectId: subject.id, dayOfWeek: day as DayOfWeek, startTime: `${9 + index * 2}:00`.padStart(5, '0'), endTime: `${10 + index * 2}:00`, room: `Room ${201 + index}` });
      for (let offset = -28; offset < 0; offset++) {
        if ((addDays(today, offset).getDay() + 6) % 7 === day) attendance.markAttendance(subject.id, date(offset), (Math.abs(offset) + index) % 6 === 0 ? 'absent' : 'present', entry.id);
      }
    });
  }
  useAssignmentStore.getState().addAssignment({ title: 'Build a binary search tree', subjectId: subjects[0].id, dueDate: date(3), priority: 'high', notes: 'Sample assignment — try editing or completing it.' });
  useAssignmentStore.getState().addAssignment({ title: 'Design a campus database', subjectId: subjects[3].id, dueDate: date(6), priority: 'medium' });
  useExamStore.getState().addExam({ subjectId: subjects[1].id, type: 'midsem', date: date(8), startTime: '10:00', room: 'Hall A', syllabus: 'Network layers, routing, and transport protocols' });
  useSettingsStore.setState({ onboardingCompleted: true, isPro: true, cloudAiEnabled: false, demoModeEnabled: true });
}
