import { createApp } from './app';
import { serverConfig } from './config';
import { log } from './shared/infrastructure/logger';

function startServer(): void {
  const { port, host, env } = serverConfig;
  const app = createApp();

  app.listen(port, host, () => {
    log.info(`🚀 Server running on http://${host}:${port}`);
    log.info(`📝 Environment: ${env}`);
    log.info(`✅ All systems operational`);
  });
}

process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
