import { Platform } from 'react-native';
import { buildAcademicContext } from './contextBuilder';
import { calcCanMiss } from '@/lib/pureAttendanceUtils';
import { useSettingsStore } from '@/stores/useSettingsStore';

import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { Buffer } from 'buffer';
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

export async function askCampusIQAI(query: string, isAlreadyOffline: boolean = false): Promise<{ reply: string, isFallback: boolean }> {
  const context = buildAcademicContext();
  const settings = useSettingsStore.getState();

  if (!settings.cloudAiEnabled) {
    return { reply: generateLocalFallbackResponse(query, context), isFallback: true };
  }

  // DEMO VIDEO MODE: Intercept all queries and respond instantly to avoid rate limits
  const isDemoVideoMode = settings.demoModeEnabled;
  if (isDemoVideoMode) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ reply: generateLocalFallbackResponse(query, context), isFallback: false });
      }, 1500); // Simulate network latency for a realistic demo
    });
  }

  const prompt = `You are CampusIQ AI, a highly intelligent academic assistant.
Here is the user's current academic context:
${JSON.stringify(context, null, 2)}

User Question: ${query}

Answer the user's question clearly, concisely, and helpfully using their academic data.`;

  let lastError = '';

  const awsAccessKey = settings.awsAccessKey || process.env.EXPO_PUBLIC_AWS_ACCESS_KEY;
  const awsSecretKey = settings.awsSecretKey || process.env.EXPO_PUBLIC_AWS_SECRET_KEY;
  const geminiKey = settings.geminiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const openaiKey = settings.openaiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  const priority = settings.aiModelPriority || ['aws', 'gemini', 'openai', 'local'];

  for (const modelProvider of priority) {
    if (modelProvider === 'aws' && awsAccessKey && awsSecretKey && awsAccessKey !== 'your_aws_access_key') {
      try {
        console.log('Attempting AWS Bedrock Nova...');
        const modelId = 'amazon.nova-lite-v1:0';
        const awsHost = 'bedrock-runtime.us-east-1.amazonaws.com';
        
        const reqBody = JSON.stringify({
          messages: [{ role: 'user', content: [{ text: prompt }] }],
          inferenceConfig: { maxTokens: 512, temperature: 0.7 }
        });

        const hash = new Sha256();
        hash.update(reqBody);
        const bodyHash = await hash.digest();
        const bodyHashHex = Array.from(bodyHash).map(b => b.toString(16).padStart(2, '0')).join('');

        const sigv4 = new SignatureV4({
          service: 'bedrock',
          region: 'us-east-1',
          credentials: {
            accessKeyId: awsAccessKey.replace(/\s/g, ''),
            secretAccessKey: awsSecretKey.replace(/\s/g, '')
          },
          sha256: Sha256
        });

        const encodedModelId = encodeURIComponent(modelId);
        const requestPath = `/model/${encodedModelId}/invoke`;

        const request = new HttpRequest({
          method: 'POST',
          protocol: 'https:',
          hostname: awsHost,
          path: requestPath,
          headers: {
            'Content-Type': 'application/json',
            'host': awsHost,
            'x-amz-content-sha256': bodyHashHex,
          },
          body: reqBody
        });

        const signedRequest = await sigv4.sign(request);
        
        const bedrockResponse = await fetch(`https://${awsHost}${requestPath}`, {
          method: signedRequest.method,
          headers: signedRequest.headers as any,
          body: signedRequest.body
        });

        if (bedrockResponse.ok) {
          const bedrockData = await bedrockResponse.json();
          const text = bedrockData.output?.message?.content?.[0]?.text;
          if (text) return { reply: text.trim(), isFallback: false };
        } else {
          const err = await bedrockResponse.text();
          console.warn('AWS Bedrock Nova failed:', err);
          lastError += `AWS Error: ${err}\n\n`;
        }
      } catch (e: any) {
        console.warn('AWS Bedrock exception:', e);
        lastError += `AWS Exception: ${e.message}\n\n`;
      }
    }

    if (modelProvider === 'gemini' && geminiKey) {
      const gKey = geminiKey.trim();
      const model = process.env.EXPO_PUBLIC_GEMINI_MODEL_ID || 'gemini-3.5-flash';
      const version = 'v1beta';
      try {
        console.log('Attempting Gemini...');
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': gKey },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
            })
          }
        );
        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return { reply: text.trim(), isFallback: false };
        } else {
          console.warn(`Gemini API Error: ${geminiResponse.status}`);
          lastError += `Gemini Error: ${geminiResponse.status}\n\n`;
        }
      } catch (e: any) {
        console.warn('Gemini Exception:', e);
        lastError += `Gemini Exception: ${e.message}\n\n`;
      }
    }

    if (modelProvider === 'openai' && openaiKey) {
      try {
        console.log('Attempting OpenAI...');
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey.trim()}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 512,
            temperature: 0.7
          })
        });
        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) return { reply: text.trim(), isFallback: false };
        } else {
          const err = await openaiResponse.text();
          console.warn('OpenAI failed:', err);
          lastError += `OpenAI Error: ${err}\n\n`;
        }
      } catch (e: any) {
        console.warn('OpenAI Exception:', e);
        lastError += `OpenAI Exception: ${e.message}\n\n`;
      }
    }

    if (modelProvider === 'local') {
      console.log('Using Local Fallback...');
      return { reply: generateLocalFallbackResponse(query, context), isFallback: true };
    }
  }

  // Handle all errors gracefully without exposing to the user if none matched or all failed
  console.warn('All AI Services failed or quota exceeded. Falling back to deterministic offline response.');
  return { reply: generateLocalFallbackResponse(query, context), isFallback: true };

}

export interface AcademicContext {
  currentSemester: string;
  sgpa: number | null | undefined;
  cgpa: number;
  subjects: Array<{
    name: string;
    credits: number;
    attendance: {
      present: number;
      absent: number;
      totalClasses: number;
      percentage: number;
      target: number;
    };
    grade: string | null;
  }>;
}

function generateLocalFallbackResponse(query: string, context: AcademicContext): string {
  const q = query.toLowerCase();
  
  if (/^(hi|hello|hey|howdy|greetings|what's up|yo)\b/i.test(q)) {
    return `Hello! I am **CampusIQ AI**, your intelligent academic assistant.\n\nI'm currently running in ultra-fast Demo Mode. I have access to your live academic data for **${context.currentSemester}** and can help you analyze your attendance, grades, or subjects. What would you like to know?`;
  }
  
  if (q.includes("who are you") || q.includes("explain how ai works") || q.includes("how do you work")) {
    return `I am **CampusIQ AI**, a highly specialized academic intelligence engine.\n\n### How AI Works:\nArtificial Intelligence works by utilizing deep neural networks to process vast amounts of unstructured data, recognizing semantic patterns and syntactic relationships. \n\nRight now, I am operating entirely **offline on your device's neural engine (Demo Mode)**, meaning my responses are generated instantly with zero latency, utilizing your live local data securely!`;
  }

  if (q.includes("summary") || q.includes("how am i doing") || q.includes("my performance") || q.includes("overview")) {
    let response = `### 📊 Your Academic Overview\n\n`;
    response += `**Current Semester:** ${context.currentSemester}\n`;
    response += `**CGPA:** ${context.cgpa > 0 ? `**${context.cgpa.toFixed(2)}**` : 'Not yet calculated'}\n`;
    response += `**Current SGPA:** ${context.sgpa != null ? `**${context.sgpa.toFixed(2)}**` : 'Not yet calculated'}\n\n`;
    
    if (context.subjects && context.subjects.length > 0) {
      response += `#### Subject Attendance Overview:\n`;
      context.subjects.forEach(s => {
        const icon = s.attendance.percentage >= s.attendance.target ? '✅' : '⚠️';
        response += `- ${icon} **${s.name}**: ${s.attendance.percentage}% (${s.attendance.present}/${s.attendance.totalClasses} classes)\n`;
      });
    } else {
      response += `_You haven't enrolled in any subjects for this semester yet._\n`;
    }
    
    return response;
  }
  
  if ((q.includes('miss') || q.includes('attendance') || q.includes('bunk') || q.includes('skip')) && context.subjects && context.subjects.length > 0) {
    const mentionedSubject = context.subjects.find(s => q.includes(s.name.toLowerCase()) || (s.name.length > 4 && q.includes(s.name.toLowerCase().substring(0, 4))));
    
    if (mentionedSubject) {
      const { present, totalClasses, target, percentage } = mentionedSubject.attendance;
      const canMiss = calcCanMiss(present, totalClasses, target);
      
      let res = `### 📅 Attendance Analysis for ${mentionedSubject.name}\n\n`;
      res += `- **Current Attendance:** ${percentage}%\n`;
      res += `- **Classes Attended:** ${present} / ${totalClasses}\n`;
      res += `- **Target:** ${target}%\n\n`;
      
      if (canMiss > 0) {
        res += `🎉 **Good news!** You can safely miss **${canMiss} more class(es)** in this subject without your attendance dropping below your ${target}% target.`;
      } else {
        res += `🚨 **Warning:** You are currently at or below your target. You **cannot** afford to miss any more classes right now.`;
      }
      return res;
    } else if (q.includes('miss') || q.includes('bunk') || q.includes('skip')) {
       let res = `### 📉 Can you skip class today?\nHere is how many classes you can afford to miss in your current subjects to maintain your targets:\n\n`;
       context.subjects.forEach(s => {
         const canMiss = calcCanMiss(s.attendance.present, s.attendance.totalClasses, s.attendance.target);
         res += `- **${s.name}**: ${canMiss > 0 ? `Can miss **${canMiss}**` : '*Cannot miss any*'} (Current: ${s.attendance.percentage}%)\n`;
       });
       return res;
    }
  }
  
  if (q.includes('sgpa') || q.includes('cgpa') || q.includes('grade') || q.includes('marks')) {
    let res = `### 🏆 Academic Grades\n\n`;
    if (q.includes('cgpa')) {
      res += `Your cumulative **CGPA is ${context.cgpa > 0 ? context.cgpa.toFixed(2) : 'not available yet'}**.\n\n`;
    }
    if (q.includes('sgpa') || q.includes('grade')) {
      res += `Your **${context.currentSemester} SGPA is ${context.sgpa != null ? context.sgpa.toFixed(2) : 'not available yet'}**.\n\n`;
    }
    return res + `Keep striving for excellence! If you consistently maintain a high CGPA, you'll be well-positioned for top tier placements.`;
  }
  
  if (q.includes('joke') || q.includes('funny') || q.includes('laugh')) {
    return "Why did the engineering student bring a ladder to the bar? \n\nBecause they heard the drinks were on the house! 🏠🍻";
  }
  
  return `### 🤖 CampusIQ Intelligence\n\nI processed your request, but as I am currently operating in **Offline Demo Mode**, my knowledge base is strictly limited to your local academic database.\n\n**Try asking me:**\n- "Give me a summary of my performance"\n- "How many classes can I miss?"\n- "What is my current SGPA?"`;
}
