export const aiDefaults = {
  geminiKey: process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  awsAccessKey: process.env.AWS_ACCESS_KEY || process.env.EXPO_PUBLIC_AWS_ACCESS_KEY || '',
  awsSecretKey: process.env.AWS_SECRET_KEY || process.env.EXPO_PUBLIC_AWS_SECRET_KEY || '',
  openaiKey: process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
};
