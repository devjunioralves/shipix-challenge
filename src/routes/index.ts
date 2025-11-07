import type { Router } from 'express';
import { setupHealthRoutes } from './health.routes';
import { setupOrdersRoutes } from './orders.routes';
import { setupWebhooksRoutes } from './webhooks.routes';

export function setupRoutes(router: Router): void {
  setupHealthRoutes(router);
  setupOrdersRoutes(router);
  setupWebhooksRoutes(router);
}
