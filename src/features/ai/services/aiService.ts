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

  const prompt = `You are CampusIQ AI, a highly intelligent academic assistant.
Here is the user's current academic context:
${JSON.stringify(context, null, 2)}

User Question: ${query}

Answer the user's question clearly, concisely, and helpfully using their academic data.`;

  let lastError = '';

  // Read keys directly from .env to bypass any empty values cached in Zustand's local storage
  const awsAccessKey = process.env.AWS_ACCESS_KEY || process.env.EXPO_PUBLIC_AWS_ACCESS_KEY || settings.awsAccessKey;
  const awsSecretKey = process.env.AWS_SECRET_KEY || process.env.EXPO_PUBLIC_AWS_SECRET_KEY || settings.awsSecretKey;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || settings.geminiKey;

  // 1. Try Gemini first (detect Bearer vs API key)
  if (geminiKey) {
    const gKey = geminiKey.trim();
    const isBearer = gKey.startsWith('AQ.') || gKey.startsWith('ya29.') || gKey.startsWith('eyJ');

    const geminiAttempts = [
      { version: 'v1beta', model: 'gemini-2.0-flash-lite' },
      { version: 'v1beta', model: 'gemini-1.5-flash-8b' },
      { version: 'v1beta', model: 'gemini-1.5-flash' },
      { version: 'v1', model: 'gemini-pro' },
    ];
    for (const { version, model } of geminiAttempts) {
      try {
        const url = isBearer
          ? `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`
          : `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${gKey}`;
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (isBearer) headers['Authorization'] = `Bearer ${gKey}`;

        const geminiResponse = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return { reply: text.trim(), isFallback: false };
        } else {
          lastError += `Gemini(${model}):${geminiResponse.status} `;
        }
      } catch (e: any) {
        lastError += `Gemini(${model}):err `;
      }
    }
  }

  // 2. Try AWS Bedrock second if Gemini fails or is missing
  if (awsAccessKey && awsSecretKey) {
    try {
      console.log('Attempting AWS Bedrock Nova...');
      const modelId = 'amazon.nova-lite-v1:0';
      
      const sigv4 = new SignatureV4({
        service: 'bedrock',
        region: 'us-east-1',
        credentials: {
          accessKeyId: awsAccessKey.trim(),
          secretAccessKey: awsSecretKey.trim()
        },
        sha256: Sha256
      });

      const reqBody = JSON.stringify({
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 512, temperature: 0.7 }
      });

      const request = new HttpRequest({
        method: 'POST',
        protocol: 'https:',
        hostname: 'bedrock-runtime.us-east-1.amazonaws.com',
        path: `/model/${modelId}/invoke`,
        headers: {
          'Content-Type': 'application/json',
          'host': 'bedrock-runtime.us-east-1.amazonaws.com'
        },
        body: reqBody
      });

      const signedRequest = await sigv4.sign(request);
      
      const bedrockResponse = await fetch(`https://bedrock-runtime.us-east-1.amazonaws.com/model/${modelId}/invoke`, {
        method: signedRequest.method,
        headers: signedRequest.headers as any,
        body: signedRequest.body
      });

      if (bedrockResponse.ok) {
        const bedrockData = await bedrockResponse.json();
        // Nova response format
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

  // 3. No fallback, just return the errors
  if (lastError) {
    return { reply: `AI Request Failed:\n\n${lastError.trim()}\n\nPlease check that your API keys are valid.`, isFallback: false };
  }

  return { reply: "Please add your Gemini or AWS API keys in the .env file to use the AI.", isFallback: false };

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
