import type { Request, Response, Router } from 'express';
import { log } from '../shared/infrastructure/logger';

export function setupWebhooksRoutes(router: Router): void {
  router.post('/webhook/whatsapp', (req: Request, res: Response) => {
    try {
      log.info('Received WhatsApp webhook', { body: req.body });

      res.status(200).json({ success: true });
    } catch (error) {
      log.error('WhatsApp webhook error', error as Error);
      res.status(500).json({
        success: false,
        error: 'Webhook processing failed',
      });
    }
  });

  router.post('/webhook/n8n', (req: Request, res: Response) => {
    try {
      log.info('Received n8n webhook', { body: req.body });

      res.status(200).json({ success: true });
    } catch (error) {
      log.error('n8n webhook error', error as Error);
      res.status(500).json({
        success: false,
        error: 'Webhook processing failed',
      });
    }
  });
}
