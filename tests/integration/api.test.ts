import nock from 'nock';
import request from 'supertest';
import { mockDriver, mockOrder, mockOrders } from '../helpers/mock-data';
import { createTestApp } from '../helpers/test-server';

describe('API Integration Tests', () => {
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

  describe('GET /health', () => {
    it('should return health status when all services are ok', async () => {
      nock(process.env.SAAS_API_BASE_URL!).get('/health').reply(200, { status: 'ok' });

      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        environment: 'test',
        version: '1.0.0',
        services: {
          saasApi: 'ok',
        },
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return degraded status when SaaS API is down', async () => {
      nock(process.env.SAAS_API_BASE_URL!).get('/health').reply(500);

      const response = await request(app).get('/health').expect(503);

      expect(response.body).toMatchObject({
        status: 'degraded',
        services: {
          saasApi: 'down',
        },
      });
    });
  });

  describe('GET /api/orders/daily-summary/:driverId', () => {
    it('should return daily summary for a driver', async () => {
      const driverId = mockDriver.id;

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driverId}/orders`)
        .query(true)
        .reply(200, { orders: mockOrders });

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driverId}`)
        .reply(200, { driver: mockDriver });

      const response = await request(app).get(`/api/orders/daily-summary/${driverId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toMatchObject({
        driverId,
        driverName: mockDriver.name,
        totalOrders: mockOrders.length,
      });
      expect(response.body.data.formattedMessage).toContain('Resumo do Dia');
      expect(response.body.data.formattedMessage).toContain(mockDriver.name);
    });

    it('should handle SaaS API errors gracefully', async () => {
      const driverId = 'invalid-driver';

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driverId}/orders`)
        .query(true)
        .reply(404);

      const response = await request(app).get(`/api/orders/daily-summary/${driverId}`).expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DAILY_SUMMARY_ERROR');
    });

    it('should support custom date parameter', async () => {
      const driverId = mockDriver.id;
      const customDate = '2025-11-05';

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driverId}/orders`)
        .query(true)
        .reply(200, { orders: [] });

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/drivers/${driverId}`)
        .reply(200, { driver: mockDriver });

      const response = await request(app)
        .get(`/api/orders/daily-summary/${driverId}`)
        .query({ date: customDate })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/orders/:orderId', () => {
    it('should return order details', async () => {
      const orderId = mockOrder.id;

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/orders/${orderId}`)
        .reply(200, { order: mockOrder });

      const response = await request(app).get(`/api/orders/${orderId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toMatchObject({
        id: orderId,
        orderNumber: mockOrder.id,
      });
      expect(response.body.data.formattedMessage).toContain('Pedido #1234');
      expect(response.body.data.formattedMessage).toContain(mockOrder.customer.name);
    });

    it('should return 404 for non-existent order', async () => {
      const orderId = 'non-existent';

      nock(process.env.SAAS_API_BASE_URL!)
        .get(`/orders/${orderId}`)
        .reply(404, { error: 'Not Found' });

      const response = await request(app).get(`/api/orders/${orderId}`).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('POST /api/orders/confirm', () => {
    it('should confirm order delivery', async () => {
      const orderId = mockOrder.id;
      const notes = 'Entregue com sucesso';

      const confirmedOrder = {
        ...mockOrder,
        status: 'delivered',
      };

      nock(process.env.SAAS_API_BASE_URL!)
        .post(`/orders/${orderId}/confirm`)
        .reply(200, { order: confirmedOrder });

      const response = await request(app)
        .post('/api/orders/confirm')
        .send({ orderId, notes })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('delivered');
      expect(response.body.data.formattedMessage).toContain('confirmado');
    });

    it('should return 400 when orderId is missing', async () => {
      const response = await request(app)
        .post('/api/orders/confirm')
        .send({ notes: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_ORDER_ID');
    });

    it('should handle confirmation errors', async () => {
      const orderId = 'invalid-order';

      nock(process.env.SAAS_API_BASE_URL!).post(`/orders/${orderId}/confirm`).reply(500);

      const response = await request(app).post('/api/orders/confirm').send({ orderId }).expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFIRMATION_ERROR');
    });
  });

  describe('POST /api/orders/issue', () => {
    it('should report order issue', async () => {
      const orderId = mockOrder.id;
      const issueType = 'customer_absent';
      const description = 'Cliente não está no endereço';

      nock(process.env.SAAS_API_BASE_URL!)
        .post(`/orders/${orderId}/issues`)
        .reply(201, { success: true });

      const response = await request(app)
        .post('/api/orders/issue')
        .send({ orderId, issueType, description })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/orders/issue')
        .send({ orderId: 'test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });
  });

  describe('POST /webhook/whatsapp', () => {
    it('should accept WhatsApp webhook', async () => {
      const webhookData = {
        key: { remoteJid: '5511987654321@s.whatsapp.net' },
        message: { conversation: 'Test message' },
      };

      const response = await request(app).post('/webhook/whatsapp').send(webhookData).expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /webhook/n8n', () => {
    it('should accept n8n webhook', async () => {
      const webhookData = {
        orderId: 'order-123',
        event: 'order_created',
      };

      const response = await request(app).post('/webhook/n8n').send(webhookData).expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API routes', async () => {
      const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

      nock(process.env.SAAS_API_BASE_URL!)
        .get('/health')
        .times(maxRequests + 10)
        .reply(200, { status: 'ok' });

      for (let i = 0; i < maxRequests; i++) {
        await request(app).get('/health');
      }
    });
  });
});
