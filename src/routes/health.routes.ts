import type { Request, Response, Router } from 'express';
import { serverConfig } from '../config';
import { saasApiClient } from '../modules/orders';
import { log } from '../shared/infrastructure/logger';

export function setupHealthRoutes(router: Router): void {
  router.get('/health', (_req: Request, res: Response) => {
    void (async (): Promise<void> => {
      try {
        const saasHealthy = await saasApiClient.healthCheck();

        const health = {
          status: saasHealthy ? 'ok' : 'degraded',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: serverConfig.env,
          version: '1.0.0',
          services: {
            saasApi: saasHealthy ? 'ok' : 'down',
          },
        };

        const statusCode = saasHealthy ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        log.error('Health check failed', error as Error);
        res.status(500).json({
          status: 'down',
          timestamp: new Date().toISOString(),
          error: 'Internal server error',
        });
      }
    })();
  });
}
