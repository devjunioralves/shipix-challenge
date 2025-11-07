import { createApp } from './app';
import { serverConfig } from './config';
import { log } from './shared/infrastructure/logger';

function startServer(): void {
  const { port, env } = serverConfig;
  log.info('Starting server...');

  const app = createApp();
  log.info('App created successfully');

  const server = app.listen(port, () => {
    log.info(`🚀 Server running on http://localhost:${port}`);
    log.info(`📝 Environment: ${env}`);
    log.info(`✅ All systems operational`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      log.error(`Port ${port} is already in use`);
    } else {
      log.error('Server error:', error);
    }
    process.exit(1);
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
