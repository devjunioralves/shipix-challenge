import type { Request, Response, Router } from 'express';
import { orderFormatter, saasApiClient } from '../modules/orders';
import { log } from '../shared/infrastructure/logger';
import { startOfDay } from '../shared/utils/helpers';
import { DailySummarySchema, validateSchema } from '../shared/validators/schemas';

export function setupOrdersRoutes(router: Router): void {
  router.get('/api/orders/daily-summary/:driverId', (req: Request, res: Response) => {
    void (async (): Promise<void> => {
      try {
        const { driverId } = req.params;
        const date = req.query.date ? new Date(req.query.date as string) : startOfDay();

        log.info(`Fetching daily summary for driver ${driverId}`, { date });

        const orders = await saasApiClient.getDriverOrders(driverId, date);

        const driverInfo = await saasApiClient.getDriverInfo(driverId);

        const urgentOrders = orders.filter((o) => o.priority === 'urgent').length;
        const completedOrders = orders.filter((o) => o.status === 'delivered').length;
        const pendingOrders = orders.filter((o) => o.status === 'pending').length;

        const summary = {
          date: date.toISOString(),
          driverId,
          driverName: driverInfo.name,
          totalOrders: orders.length,
          completedOrders,
          pendingOrders,
          urgentOrders,
          orders,
        };

        const validatedSummary = validateSchema(DailySummarySchema, summary);

        const formattedMessage = orderFormatter.formatDailySummary(validatedSummary);

        res.json({
          success: true,
          data: {
            summary: validatedSummary,
            formattedMessage,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        log.error('Failed to get daily summary', error as Error);
        res.status(500).json({
          success: false,
          error: {
            code: 'DAILY_SUMMARY_ERROR',
            message: 'Failed to fetch daily summary',
          },
          timestamp: new Date().toISOString(),
        });
      }
    })();
  });

  router.get('/api/orders/:orderId', (req: Request, res: Response) => {
    void (async (): Promise<void> => {
      try {
        const { orderId } = req.params;

        log.info(`Fetching order details for ${orderId}`);

        const order = await saasApiClient.getOrderDetails(orderId);
        const formattedMessage = orderFormatter.formatOrderDetails(order);

        res.json({
          success: true,
          data: {
            order,
            formattedMessage,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        log.error(`Failed to get order ${req.params.orderId}`, error as Error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('Not Found')) {
          res.status(404).json({
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'Order not found',
            },
            timestamp: new Date().toISOString(),
          });
        } else {
          res.status(500).json({
            success: false,
            error: {
              code: 'ORDER_FETCH_ERROR',
              message: 'Failed to fetch order details',
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
    })();
  });

  router.post('/api/orders/confirm', (req: Request, res: Response) => {
    void (async (): Promise<void> => {
      try {
        const { orderId, notes, photo } = req.body as {
          orderId?: string;
          notes?: string;
          photo?: string;
        };

        if (!orderId) {
          res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_ORDER_ID',
              message: 'Order ID is required',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }

        log.info(`Confirming delivery for order ${orderId}`);

        const order = await saasApiClient.confirmDelivery(orderId, notes, photo);
        const formattedMessage = orderFormatter.formatConfirmation(order);

        res.json({
          success: true,
          data: {
            order,
            formattedMessage,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        log.error('Failed to confirm delivery', error as Error);
        res.status(500).json({
          success: false,
          error: {
            code: 'CONFIRMATION_ERROR',
            message: 'Failed to confirm delivery',
          },
          timestamp: new Date().toISOString(),
        });
      }
    })();
  });

  router.post('/api/orders/issue', (req: Request, res: Response) => {
    void (async (): Promise<void> => {
      try {
        const { orderId, issueType, description } = req.body as {
          orderId?: string;
          issueType?: string;
          description?: string;
        };

        if (!orderId || !issueType || !description) {
          res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_FIELDS',
              message: 'Order ID, issue type, and description are required',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }

        log.info(`Reporting issue for order ${orderId}`, { issueType });

        await saasApiClient.reportIssue(orderId, issueType, description);

        res.json({
          success: true,
          data: {
            message: 'Issue reported successfully',
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        log.error('Failed to report issue', error as Error);
        res.status(500).json({
          success: false,
          error: {
            code: 'ISSUE_REPORT_ERROR',
            message: 'Failed to report issue',
          },
          timestamp: new Date().toISOString(),
        });
      }
    })();
  });
}
