import { spawnSync } from 'node:child_process';

// A public demo must never inherit .env files or inline private AI keys.
const env = { ...process.env, EXPO_NO_DOTENV: '1', EXPO_NO_CLIENT_ENV_VARS: '1' };
for (const key of Object.keys(env)) {
  if (/^(EXPO_PUBLIC_)?(AWS_|GEMINI_|OPENAI_)/.test(key)) delete env[key];
}
const result = spawnSync(process.execPath, ['node_modules/expo/bin/cli', 'export', '--platform', 'web', ...process.argv.slice(2)], { stdio: 'inherit', env });
process.exit(result.status ?? 1);
