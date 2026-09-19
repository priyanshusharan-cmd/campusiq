import { Platform } from 'react-native';
import { buildAcademicContext } from './contextBuilder';
import { calcCanMiss } from '@/lib/pureAttendanceUtils';
import { useSettingsStore } from '@/stores/useSettingsStore';

// We call the local agent-server
const AGENT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/chat' : 'http://127.0.0.1:3000/api/chat';

export async function askCampusIQAI(query: string): Promise<{ reply: string, isFallback: boolean }> {
  const context = buildAcademicContext();
  const settings = useSettingsStore.getState();

  if (!settings.cloudAiEnabled) {
    console.log('Cloud AI is disabled, going completely offline.');
    return { reply: generateLocalFallbackResponse(query, context), isFallback: true };
  }

  try {
    const response = await fetch(AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context,
        keys: {
          geminiKey: settings.geminiKey,
          awsAccessKey: settings.awsAccessKey,
          awsSecretKey: settings.awsSecretKey
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent server error: ${response.status}`);
    }

    const data = await response.json();
    return { reply: data.reply || "I didn't get a proper response.", isFallback: false };
  } catch (error) {
    console.warn('Network or AI unavailable, attempting fallback:', error.message);
    if (settings.useOfflineAIFallback) {
      return { reply: generateLocalFallbackResponse(query, context), isFallback: true };
    }
    throw error;
  }
}

function generateLocalFallbackResponse(query: string, context: any): string {
  const q = query.toLowerCase();
  
  if (/^(hi|hello|hey|howdy|greetings)\b/i.test(q)) {
    return "Hi there! CampusIQ AI is currently offline, but I can still help you calculate attendance, SGPA, and CGPA locally. What do you need help with?";
  }
  
  if (q.includes('miss') && (q.includes('class') || q.includes('classes'))) {
    const subject = context.subjects.find((s: any) => q.includes(s.name.toLowerCase()));
    if (subject) {
      const { present, totalClasses, target } = subject.attendance;
      const canMiss = calcCanMiss(present, totalClasses, target);
      if (canMiss > 0) {
        return `In ${subject.name}, your attendance is ${subject.attendance.percentage}%. You can safely miss ${canMiss} more class(es) and maintain your target of ${target}%.`;
      } else {
        return `In ${subject.name}, your attendance is ${subject.attendance.percentage}%. You are below or exactly at your target of ${target}%. You shouldn't miss any more classes.`;
      }
    }
    return 'Which subject are you asking about? I can calculate attendance for your enrolled subjects locally.';
  }
  
  if (q.includes('sgpa')) {
    return `Your current SGPA for ${context.currentSemester} is ${context.sgpa || 'not calculated yet'}.`;
  }
  
  if (q.includes('cgpa')) {
    return `Your overall CGPA is ${context.cgpa || 'not calculated yet'}.`;
  }
  
  return "CampusIQ AI is currently unavailable, but I can still calculate your attendance and SGPA locally if you ask about a specific subject or your GPA.";
}
