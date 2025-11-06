import { log } from '@/shared/infrastructure/logger';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3000'),
  HOST: z.string().default('localhost'),

  SAAS_API_BASE_URL: z.string().url(),
  SAAS_API_KEY: z.string().min(1),
  SAAS_API_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default('30000'),

  WHATSAPP_API_URL: z.string().url(),
  WHATSAPP_API_KEY: z.string().min(1),
  WHATSAPP_INSTANCE_NAME: z.string().default('driver-app'),
  WHATSAPP_WEBHOOK_TOKEN: z.string().min(1),

  N8N_WEBHOOK_URL: z.string().url(),
  N8N_API_KEY: z.string().min(1).optional(),

  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),
  OPENAI_MAX_TOKENS: z.string().transform(Number).pipe(z.number().int().positive()).default('1000'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs'),

  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('100'),
  WEBHOOK_SECRET: z.string().min(16),

  ENABLE_AI_ASSISTANT: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  ENABLE_DAILY_SUMMARIES: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  ENABLE_EMERGENCY_ALERTS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

function validateEnv(): z.infer<typeof envSchema> {
  try {
    const env = envSchema.parse(process.env);
    log.info('Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      log.error('Environment validation failed', error, { missing: missingVars });
      console.error('ERROR: Invalid environment variables:');
      console.error(missingVars.join('\n'));
      console.error(
        '\n ERROR: Please check your .env file and ensure all required variables are set.'
      );
      console.error('ERROR: See .env.example for reference.');
      process.exit(1);
    }
    throw error;
  }
}

export const config = validateEnv();

export const serverConfig = {
  env: config.NODE_ENV,
  port: config.PORT,
  host: config.HOST,
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',
};

export const saasApiConfig = {
  baseUrl: config.SAAS_API_BASE_URL,
  apiKey: config.SAAS_API_KEY,
  timeout: config.SAAS_API_TIMEOUT,
};

export const whatsappConfig = {
  apiUrl: config.WHATSAPP_API_URL,
  apiKey: config.WHATSAPP_API_KEY,
  instanceName: config.WHATSAPP_INSTANCE_NAME,
  webhookToken: config.WHATSAPP_WEBHOOK_TOKEN,
};

export const n8nConfig = {
  webhookUrl: config.N8N_WEBHOOK_URL,
  apiKey: config.N8N_API_KEY,
};

export const openaiConfig = {
  apiKey: config.OPENAI_API_KEY,
  model: config.OPENAI_MODEL,
  maxTokens: config.OPENAI_MAX_TOKENS,
};

export const loggingConfig = {
  level: config.LOG_LEVEL,
  filePath: config.LOG_FILE_PATH,
};

export const securityConfig = {
  rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: config.RATE_LIMIT_MAX_REQUESTS,
  webhookSecret: config.WEBHOOK_SECRET,
};

export const featureFlags = {
  aiAssistant: config.ENABLE_AI_ASSISTANT,
  dailySummaries: config.ENABLE_DAILY_SUMMARIES,
  emergencyAlerts: config.ENABLE_EMERGENCY_ALERTS,
};

export default config;
