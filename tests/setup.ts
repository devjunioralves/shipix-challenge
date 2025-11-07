process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.HOST = 'localhost';
process.env.LOG_LEVEL = 'error';
process.env.SAAS_API_BASE_URL = 'http://mock-saas-api.test';
process.env.SAAS_API_KEY = 'test-api-key';
process.env.SAAS_API_TIMEOUT = '5000';
process.env.WHATSAPP_API_URL = 'http://mock-whatsapp.test';
process.env.WHATSAPP_API_KEY = 'test-whatsapp-key';
process.env.WHATSAPP_INSTANCE_NAME = 'test-instance';
process.env.WHATSAPP_WEBHOOK_TOKEN = 'test-webhook-token';
process.env.N8N_WEBHOOK_URL = 'http://mock-n8n.test';
process.env.N8N_API_KEY = 'test-n8n-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.OPENAI_MODEL = 'gpt-4-turbo-preview';
process.env.OPENAI_MAX_TOKENS = '1000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.WEBHOOK_SECRET = 'test-webhook-secret';
process.env.ENABLE_AI_ASSISTANT = 'false';
process.env.ENABLE_DAILY_SUMMARIES = 'true';
process.env.ENABLE_EMERGENCY_ALERTS = 'true';

jest.setTimeout(10000);

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
