import { buildAcademicContext } from './contextBuilder';
import { calcCanMiss } from '@/lib/pureAttendanceUtils';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { useSubjectStore } from '@/stores/useSubjectStore';

// Deterministic calculations used only when no model is reachable.
export async function askLocalAssistant(query: string, _isAlreadyOffline = false): Promise<{ reply: string; isFallback: boolean }> {
  const context = buildAcademicContext();
  const q = query.toLowerCase();
  const disclaimer = 'Offline calculations · calculated from your saved data, without a cloud AI model.\n\n';
  let reply: string;
  if (/schedule|timetable|tomorrow|today|class.*next/.test(q)) {
    const date = new Date();
    if (q.includes('tomorrow')) date.setDate(date.getDate() + 1);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const day = (date.getDay() + 6) % 7;
    const subjects = useSubjectStore.getState().subjects;
    const timetable = useTimetableStore.getState();
    const entries = timetable.events[dateKey] ? [] : timetable.entries.filter(e =>
      (e.date ? e.date === dateKey : e.dayOfWeek === day) && context.subjects.some(s => subjects.find(subject => subject.id === e.subjectId)?.name === s.name)
    ).sort((a,b) => a.startTime.localeCompare(b.startTime));
    reply = entries.length ? `Your schedule for ${date.toLocaleDateString()}:\n\n` + entries.map(e => `${e.startTime}–${e.endTime} · ${subjects.find(s => s.id === e.subjectId)?.name || 'Class'}${e.room ? ` · ${e.room}` : ''}`).join('\n') : `No classes are scheduled for ${date.toLocaleDateString()}.`;
  } else if (/attendance|miss|skip|bunk/.test(q)) {
    const mentioned = context.subjects.filter(s => q.includes(s.name.toLowerCase()));
    const subjects = mentioned.length ? mentioned : context.subjects;
    reply = subjects.length ? subjects.map(s => {
      const { percentage, present, totalClasses, target } = s.attendance;
      if (totalClasses === 0) return `${s.name}: No classes recorded yet. Add a timetable or mark attendance to get an estimate.`;
      const canMiss = calcCanMiss(present, totalClasses, target);
      return `${s.name}: ${percentage}% (${present}/${totalClasses} classes), target ${target}%. ${canMiss > 0 ? `You can miss ${canMiss} more classes while meeting your target.` : 'Attend your upcoming classes to meet or maintain your target.'}`;
    }).join('\n\n') + '\n\nUnmarked past classes count as present, matching the attendance tracker.' : 'Add a subject and record attendance to see your attendance analysis.';
  } else if (/grade|sgpa|cgpa|performance|summary/.test(q)) {
    reply = `Semester: ${context.currentSemester}\nCGPA: ${context.cgpa > 0 ? context.cgpa.toFixed(2) : 'Not entered yet'}\nSGPA: ${context.sgpa != null ? context.sgpa.toFixed(2) : 'Not entered yet'}\n\n` + context.subjects.map(s => `${s.name} · ${s.credits} credits${s.grade ? ` · Grade ${s.grade}` : ''}`).join('\n') + '\n\nOpen the SGPA Forecaster to experiment with target marks and grade predictions.';
  } else {
    reply = 'I can calculate attendance insights, show your schedule, and summarize your grades. Try “How many classes can I skip?”, “What classes do I have tomorrow?”, or “Show my academic summary”. For other questions, configure Gemma API or your Mac in Settings.';
  }
  return { reply: disclaimer + reply, isFallback: true };
}
