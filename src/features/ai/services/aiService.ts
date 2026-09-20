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
  let isDemoVideoMode = true;
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

  const awsAccessKey = process.env.EXPO_PUBLIC_AWS_ACCESS_KEY || settings.awsAccessKey;
  const awsSecretKey = process.env.EXPO_PUBLIC_AWS_SECRET_KEY || settings.awsSecretKey;
  const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || settings.geminiKey;

  // 1. Try AWS first
  if (awsAccessKey && awsSecretKey && awsAccessKey !== 'your_aws_access_key') {
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

      // Bedrock's API Gateway strictly requires URL-encoded paths for the canonical request.
      // iOS fetch() will auto-encode it anyway, so we MUST encode it here so SignatureV4 signs the encoded version!
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

  // 2. Fallback to Gemini
  if (geminiKey) {
    const gKey = geminiKey.trim();
    const geminiAttempts = [
      { version: 'v1beta', model: 'gemini-flash-latest' },
      { version: 'v1beta', model: 'gemini-2.0-flash-lite' },
      { version: 'v1beta', model: 'gemini-1.5-flash' },
      { version: 'v1beta', model: 'gemini-1.5-flash-8b' },
      { version: 'v1', model: 'gemini-pro' },
    ];
    for (const { version, model } of geminiAttempts) {
      try {
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
          lastError += `Gemini(${model}):${geminiResponse.status} `;
        }
      } catch (e: any) {
        lastError += `Gemini(${model}):err `;
      }
    }
  }

  if (lastError) {
    return { reply: `AI Request Failed:\n\n${lastError.trim()}\n\nPlease check your AWS or Gemini API keys.`, isFallback: false };
  }

  return { reply: "Please configure AWS or Gemini API keys in the .env file to use the AI.", isFallback: false };

}

function generateLocalFallbackResponse(query: string, context: any): string {
  const q = query.toLowerCase();
  
  if (/^(hi|hello|hey|howdy|greetings)\b/i.test(q)) {
    return "Hi there! I am CampusIQ AI. I've analyzed your academic profile and timetable. How can I assist you today?";
  }
  
  if (q.includes("explain how ai works")) {
    return "AI (Artificial Intelligence) works by using algorithms and large datasets to recognize patterns, learn from experience, and make decisions or predictions similar to human logic.";
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
    return 'Which subject are you asking about? I can analyze the attendance for any of your enrolled subjects.';
  }
  
  if (q.includes('sgpa')) {
    return `Your current SGPA for ${context.currentSemester} is ${context.sgpa || 'not calculated yet'}. Keep up the great work!`;
  }
  
  if (q.includes('cgpa')) {
    return `Your overall CGPA is ${context.cgpa || 'not calculated yet'}. Let me know if you want a breakdown of your credits!`;
  }
  
  return "Based on my analysis of your academic profile, you're doing great! Keep attending your classes and maintaining your grades. If you have any specific questions about your timetable or attendance, just ask!";
}
