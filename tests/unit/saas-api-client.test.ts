import nock from 'nock';
import { SaaSApiClient } from '../../src/modules/orders/services/saas-api-client';
import { mockDriver, mockOrder, mockOrders } from '../helpers/mock-data';

describe('SaaSApiClient Unit Tests', () => {
  let client: SaaSApiClient;
  const baseURL = process.env.SAAS_API_BASE_URL!;
  const apiKey = process.env.SAAS_API_KEY!;

  beforeEach(() => {
    client = new SaaSApiClient();
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      nock(baseURL).get('/health').reply(200, { status: 'ok' });

      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when API is down', async () => {
      nock(baseURL).get('/health').reply(500);

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      nock(baseURL).get('/health').replyWithError('Network error');

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('getDriverOrders', () => {
    it('should fetch orders for a driver', async () => {
      const driverId = mockDriver.id;
      const date = new Date('2025-11-06');

      nock(baseURL)
        .get(`/drivers/${driverId}/orders`)
        .query(true)
        .reply(200, { orders: mockOrders });

      const orders = await client.getDriverOrders(driverId, date);

      expect(orders).toEqual(mockOrders);
      expect(orders.length).toBe(mockOrders.length);
    });

    it('should throw error when driver not found', async () => {
      const driverId = 'invalid-driver';

      nock(baseURL).get(`/drivers/${driverId}/orders`).query(true).reply(404);

      await expect(client.getDriverOrders(driverId, new Date())).rejects.toThrow();
    });

    it('should retry on temporary failures', async () => {
      const driverId = mockDriver.id;

      nock(baseURL)
        .get(`/drivers/${driverId}/orders`)
        .query(true)
        .reply(500)
        .get(`/drivers/${driverId}/orders`)
        .query(true)
        .reply(200, { orders: mockOrders });

      const orders = await client.getDriverOrders(driverId, new Date());
      expect(orders).toEqual(mockOrders);
    }, 10000);
  });

  describe('getDriverInfo', () => {
    it('should fetch driver information', async () => {
      const driverId = mockDriver.id;

      nock(baseURL).get(`/drivers/${driverId}`).reply(200, { driver: mockDriver });

      const driver = await client.getDriverInfo(driverId);

      expect(driver).toEqual(mockDriver);
      expect(driver.name).toBe(mockDriver.name);
    });

    it('should throw error when driver not found', async () => {
      const driverId = 'invalid-driver';

      nock(baseURL).get(`/drivers/${driverId}`).reply(404);

      await expect(client.getDriverInfo(driverId)).rejects.toThrow();
    });
  });

  describe('getOrderDetails', () => {
    it('should fetch order details', async () => {
      const orderId = mockOrder.id;

      nock(baseURL).get(`/orders/${orderId}`).reply(200, { order: mockOrder });

      const order = await client.getOrderDetails(orderId);

      expect(order).toEqual(mockOrder);
      expect(order.orderNumber).toBe(mockOrder.id);
    });

    it('should throw error when order not found', async () => {
      const orderId = 'invalid-order';

      nock(baseURL).get(`/orders/${orderId}`).reply(404, { error: 'Not Found' });

      await expect(client.getOrderDetails(orderId)).rejects.toThrow();
    });
  });

  describe('confirmDelivery', () => {
    it('should confirm delivery with notes', async () => {
      const orderId = mockOrder.id;
      const notes = 'Entregue com sucesso';

      const confirmedOrder = { ...mockOrder, status: 'delivered' as const };

      nock(baseURL).post(`/orders/${orderId}/confirm`).reply(200, { order: confirmedOrder });

      const order = await client.confirmDelivery(orderId, notes);

      expect(order.status).toBe('delivered');
    });

    it('should confirm delivery with photo', async () => {
      const orderId = mockOrder.id;
      const notes = 'Entregue';
      const photo = 'base64-encoded-image';

      const confirmedOrder = { ...mockOrder, status: 'delivered' as const };

      nock(baseURL).post(`/orders/${orderId}/confirm`).reply(200, { order: confirmedOrder });

      const order = await client.confirmDelivery(orderId, notes, photo);

      expect(order.status).toBe('delivered');
    });

    it('should handle confirmation errors', async () => {
      const orderId = 'invalid-order';

      nock(baseURL).post(`/orders/${orderId}/confirm`).reply(500);

      await expect(client.confirmDelivery(orderId, 'test')).rejects.toThrow();
    });
  });

  describe('reportIssue', () => {
    it('should report order issue successfully', async () => {
      const orderId = mockOrder.id;
      const issueType = 'customer_absent';
      const description = 'Cliente não está';

      nock(baseURL).post(`/orders/${orderId}/issues`).reply(201, { success: true });

      await expect(client.reportIssue(orderId, issueType, description)).resolves.not.toThrow();
    });

    it('should handle issue reporting errors', async () => {
      const orderId = 'invalid-order';

      nock(baseURL).post(`/orders/${orderId}/issues`).reply(500);

      await expect(client.reportIssue(orderId, 'test', 'test')).rejects.toThrow();
    });
  });

  describe('Request Headers', () => {
    it('should include API key in all requests', async () => {
      const scope = nock(baseURL, {
        reqheaders: {
          'X-API-Key': apiKey,
        },
      })
        .get('/health')
        .reply(200);

      await client.healthCheck();

      expect(scope.isDone()).toBe(true);
    });

    it('should include correct content type for POST requests', async () => {
      const orderId = mockOrder.id;

      const scope = nock(baseURL, {
        reqheaders: {
          'content-type': 'application/json',
        },
      })
        .post(`/orders/${orderId}/confirm`)
        .reply(200, { order: mockOrder });

      await client.confirmDelivery(orderId, 'test');

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout on slow requests', async () => {
      const orderId = mockOrder.id;

      nock(baseURL).get(`/orders/${orderId}`).delay(6000).reply(200, { order: mockOrder });

      await expect(client.getOrderDetails(orderId)).rejects.toThrow();
    }, 10000);
  });
});
