import nock from 'nock';
import request from 'supertest';
import {
  mockDriver,
  mockIssueReport,
  mockOrder,
  mockOrders,
  mockWhatsAppMessage,
} from '../helpers/mock-data';
import { createTestApp } from '../helpers/test-server';

describe('E2E Tests - Complete System Flow', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  describe('Complete Daily Workflow', () => {
    it('should handle complete daily workflow from summary to delivery', async () => {
      const driverId = mockDriver.id;
      const orderId = mockOrder.id;

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driverId}/orders`)
        .query(true)
        .reply(200, { orders: mockOrders });

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driverId}`)
        .reply(200, { driver: mockDriver });

      const summaryResponse = await request(app)
        .get(`/api/orders/daily-summary/${driverId}`)
        .expect(200);

      expect(summaryResponse.body.success).toBe(true);
      expect(summaryResponse.body.data.summary.totalOrders).toBe(mockOrders.length);

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/orders/${orderId}`)
        .reply(200, { order: mockOrder });

      const orderResponse = await request(app).get(`/api/orders/${orderId}`).expect(200);

      expect(orderResponse.body.success).toBe(true);
      expect(orderResponse.body.data.order.id).toBe(orderId);

      const confirmedOrder = { ...mockOrder, status: 'delivered' };

      nock(process.env.SAAS_API_BASE_URL!)
        .post(`/orders/${orderId}/confirm`)
        .reply(200, { order: confirmedOrder });

      const confirmResponse = await request(app)
        .post('/api/orders/confirm')
        .send({ orderId, notes: 'Delivered successfully' })
        .expect(200);

      expect(confirmResponse.body.success).toBe(true);
      expect(confirmResponse.body.data.order.status).toBe('delivered');

      expect(summaryResponse.body.data.formattedMessage).toContain("Today's Summary");
      expect(orderResponse.body.data.formattedMessage).toContain('Order');
      expect(confirmResponse.body.data.formattedMessage).toContain('confirmed');
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle order issues and report them correctly', async () => {
      const orderId = mockOrder.id;

      nock(process.env.SAAS_API_BASE_URL!).get(`/orders/${orderId}`).reply(500);

      await request(app).get(`/api/orders/${orderId}`).expect(500);

      nock(process.env.SAAS_API_BASE_URL!)
        .post(`/orders/${orderId}/issues`)
        .reply(201, { success: true });

      const issueResponse = await request(app)
        .post('/api/orders/issue')
        .send(mockIssueReport)
        .expect(200);

      expect(issueResponse.body.success).toBe(true);
    });
  });

  describe('Multiple Driver Concurrent Access', () => {
    it('should handle multiple drivers accessing the system simultaneously', async () => {
      const driver1Id = 'driver-1';
      const driver2Id = 'driver-2';

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driver1Id}/orders`)
        .query(true)
        .reply(200, { orders: [mockOrder] });

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driver1Id}`)
        .reply(200, { driver: { ...mockDriver, id: driver1Id } });

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driver2Id}/orders`)
        .query(true)
        .reply(200, { orders: [mockOrders[1]] });

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driver2Id}`)
        .reply(200, { driver: { ...mockDriver, id: driver2Id } });

      const [response1, response2] = await Promise.all([
        request(app).get(`/api/orders/daily-summary/${driver1Id}`),
        request(app).get(`/api/orders/daily-summary/${driver2Id}`),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data.summary.driverId).toBe(driver1Id);
      expect(response2.body.data.summary.driverId).toBe(driver2Id);
    });
  });

  describe('Webhook Integration Flow', () => {
    it('should accept and process WhatsApp webhook events', async () => {
      const webhookResponse = await request(app)
        .post('/webhook/whatsapp')
        .send(mockWhatsAppMessage)
        .expect(200);

      expect(webhookResponse.body.success).toBe(true);
    });

    it('should accept and process n8n webhook events', async () => {
      const n8nPayload = {
        event: 'order_created',
        orderId: 'order-123',
        driverId: 'driver-123',
      };

      const webhookResponse = await request(app).post('/webhook/n8n').send(n8nPayload).expect(200);

      expect(webhookResponse.body.success).toBe(true);
    });
  });

  describe('System Health Monitoring', () => {
    it('should provide complete health check across all dependencies', async () => {
      nock(process.env.SAAS_API_BASE_URL!).get('/health').reply(200, { status: 'ok' });

      const healthResponse = await request(app).get('/health').expect(200);

      expect(healthResponse.body).toMatchObject({
        status: 'ok',
        environment: 'test',
        version: '1.0.0',
        services: {
          saasApi: 'ok',
        },
      });
      expect(healthResponse.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Validation and Security', () => {
    it('should reject invalid order confirmations', async () => {
      const invalidRequests = [{}, { orderId: '' }, { orderId: null }];

      for (const invalidRequest of invalidRequests) {
        const response = await request(app)
          .post('/api/orders/confirm')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should reject invalid issue reports', async () => {
      const invalidReports = [
        { orderId: 'test' },
        { orderId: 'test', issueType: 'invalid' },
        { issueType: 'invalid', description: 'test' },
      ];

      for (const invalidReport of invalidReports) {
        const response = await request(app)
          .post('/api/orders/issue')
          .send(invalidReport)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should handle malformed JSON in requests', async () => {
      const response = await request(app)
        .post('/api/orders/confirm')
        .set('Content-Type', 'application/json')
        .send('{"invalid json":}')
        .expect(400);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple sequential requests efficiently', async () => {
      const orderId = mockOrder.id;

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/orders/${orderId}`)
        .times(5)
        .reply(200, { order: mockOrder });

      const startTime = Date.now();

      for (let i = 0; i < 5; i++) {
        await request(app).get(`/api/orders/${orderId}`).expect(200);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000);
    });
  });
});
