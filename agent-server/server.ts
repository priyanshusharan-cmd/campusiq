import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import cors from 'cors';

import { Agent, BedrockModel, tool } from '@strands-agents/sdk';
import { GoogleModel } from '@strands-agents/sdk/models/google';
import { z } from 'zod';

// Import pure utility from CampusIQ to avoid duplicating calculations
import { calcCanMiss } from '../src/lib/pureAttendanceUtils';

const app = express();
app.use(cors());
app.use(express.json());

// CampusIQ stores academic records locally. When cloud AI is used, only the relevant context required to answer the user's question is sent to the local agent server and processed by the configured AI model. No persistent cloud database stores the student's academic records.

const calculateMissableClassesTool = tool({
  name: 'calculateMissableClasses',
  description: 'Calculates how many classes can be missed to maintain a target attendance percentage.',
  inputSchema: z.object({
    present: z.number().describe('Number of classes currently attended'),
    totalClasses: z.number().describe('Total number of classes conducted so far'),
    targetPercentage: z.number().describe('Target attendance percentage (e.g., 75, 80)')
  }),
  callback: async (input) => {
    // Use the exact same deterministic calculation from CampusIQ core
    const canMiss = calcCanMiss(input.present, input.totalClasses, input.targetPercentage);
    return JSON.stringify({ canMiss });
  }
});

const systemPrompt = `You are CampusIQ AI, a privacy-first academic assistant.
Use the provided academic context to answer the user's questions about attendance, CIE marks, grades, and SGPA/CGPA.
DO NOT guess or invent numbers. If a calculation is needed (like how many classes to miss), use the provided tools or the data in the context.
Be concise, helpful, and natural.`;

app.post('/api/chat', async (req: Request, res: Response): Promise<any> => {
  const { query, context, keys } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Determine which keys to use
  const awsAccessKey = keys?.awsAccessKey || process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = keys?.awsSecretKey || process.env.AWS_SECRET_ACCESS_KEY;
  const geminiKey = keys?.geminiKey || process.env.GEMINI_API_KEY;

  // Re-instantiate agents with the dynamic keys
  // Bedrock natively picks up environment variables if we pass credentials in clientConfig
  const bedrockModel = new BedrockModel({
    region: process.env.AWS_REGION || 'ap-south-1',
    modelId: process.env.AWS_BEDROCK_MODEL_ID || 'global.amazon.nova-2-lite-v1:0',
    maxTokens: 4096,
    temperature: 0.7,
    ...(awsAccessKey && awsSecretKey ? {
      clientConfig: {
        credentials: {
          accessKeyId: awsAccessKey,
          secretAccessKey: awsSecretKey
        }
      }
    } : {})
  });

  const geminiModel = new GoogleModel({
    modelId: 'gemini-3.6-flash',
    apiKey: geminiKey
  });

  const campusIQAgentBedrock = new Agent({
    model: bedrockModel,
    systemPrompt,
    tools: [calculateMissableClassesTool]
  });

  const campusIQAgentGemini = new Agent({
    model: geminiModel,
    systemPrompt,
    tools: [calculateMissableClassesTool]
  });

  try {
    const promptWithContext = `
Student Academic Context:
${JSON.stringify(context, null, 2)}

User Question: ${query}
`;

    let response;
    try {
      console.log('Attempting AWS Bedrock...');
      response = await campusIQAgentBedrock.invoke(promptWithContext);
    } catch (awsError: any) {
      console.warn('AWS Bedrock failed, falling back to Google Gemini...', awsError.message);
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('AWS failed and GEMINI_API_KEY is not configured for fallback');
      }
      
      console.log('Attempting Google Gemini...');
      response = await campusIQAgentGemini.invoke(promptWithContext);
    }
    
    // Extract response string
    let reply = String(response);

    res.json({ reply });
  } catch (error: any) {
    console.error('All cloud agents failed (Bedrock + Gemini):', error.message);
    res.status(503).json({ error: 'Agent unavailable' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`CampusIQ Agent Server running on port ${PORT}`);
});
