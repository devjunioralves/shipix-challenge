import { saasApiConfig } from '@/config';
import { log } from '@/shared/infrastructure/logger';
import { retryWithBackoff } from '@/shared/utils/helpers';
import type { Order, OrderStatus } from '@/shared/validators/schemas';
import axios, { type AxiosError, type AxiosInstance } from 'axios';

export class SaaSApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: saasApiConfig.baseUrl,
      timeout: saasApiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${saasApiConfig.apiKey}`,
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        log.http('SaaS API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error: AxiosError) => {
        log.error('SaaS API Request Error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        log.http('SaaS API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        log.error('SaaS API Response Error', error, {
          status: error.response?.status,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  async getDriverOrders(driverId: string, date?: Date): Promise<Order[]> {
    try {
      const dateParam = date || new Date();
      const dateStr = dateParam.toISOString().split('T')[0];

      const response = await retryWithBackoff(async () => {
        return await this.client.get<{ orders: Order[] }>(`/drivers/${driverId}/orders`, {
          params: {
            date: dateStr,
            status: 'pending,confirmed,in_transit',
          },
        });
      });

      log.info(`Fetched ${response.data.orders.length} orders for driver ${driverId}`);
      return response.data.orders;
    } catch (error) {
      log.error(`Failed to fetch orders for driver ${driverId}`, error as Error);
      throw this.handleError(error);
    }
  }

  async getOrderDetails(orderId: string): Promise<Order> {
    try {
      const response = await retryWithBackoff(async () => {
        return await this.client.get<{ order: Order }>(`/orders/${orderId}`);
      });

      log.info(`Fetched details for order ${orderId}`);
      return response.data.order;
    } catch (error) {
      log.error(`Failed to fetch order ${orderId}`, error as Error);
      throw this.handleError(error);
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    try {
      const response = await this.client.patch<{ order: Order }>(`/orders/${orderId}/status`, {
        status,
        notes,
        timestamp: new Date().toISOString(),
      });

      log.info(`Updated order ${orderId} status to ${status}`);
      return response.data.order;
    } catch (error) {
      log.error(`Failed to update order ${orderId}`, error as Error);
      throw this.handleError(error);
    }
  }

  async confirmDelivery(orderId: string, notes?: string, photo?: string): Promise<Order> {
    try {
      const response = await this.client.post<{ order: Order }>(`/orders/${orderId}/confirm`, {
        status: 'delivered',
        notes,
        photo,
        timestamp: new Date().toISOString(),
      });

      log.info(`Confirmed delivery for order ${orderId}`);
      return response.data.order;
    } catch (error) {
      log.error(`Failed to confirm delivery for order ${orderId}`, error as Error);
      throw this.handleError(error);
    }
  }

  async reportIssue(orderId: string, issueType: string, description: string): Promise<void> {
    try {
      await this.client.post(`/orders/${orderId}/issues`, {
        issueType,
        description,
        timestamp: new Date().toISOString(),
      });

      log.info(`Reported issue for order ${orderId}`, { issueType });
    } catch (error) {
      log.error(`Failed to report issue for order ${orderId}`, error as Error);
      throw this.handleError(error);
    }
  }

  async getDriverInfo(driverId: string): Promise<{ id: string; name: string; phone: string }> {
    try {
      const response = await this.client.get<{
        driver: { id: string; name: string; phone: string };
      }>(`/drivers/${driverId}`);

      log.info(`Fetched info for driver ${driverId}`);
      return response.data.driver;
    } catch (error) {
      log.error(`Failed to fetch driver ${driverId} info`, error as Error);
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const message =
          axiosError.response.data?.message ||
          axiosError.response.data?.error ||
          'API request failed';

        switch (status) {
          case 400:
            return new Error(`Bad Request: ${message}`);
          case 401:
            return new Error('Unauthorized: Invalid API credentials');
          case 404:
            return new Error(`Not Found: ${message}`);
          case 429:
            return new Error('Rate limit exceeded. Please try again later.');
          case 500:
          case 502:
          case 503:
            return new Error('SaaS API is temporarily unavailable. Please try again later.');
          default:
            return new Error(`API Error (${status}): ${message}`);
        }
      } else if (axiosError.request) {
        return new Error('No response from SaaS API. Please check your connection.');
      }
    }

    return error instanceof Error ? error : new Error('An unexpected error occurred');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      log.warn('SaaS API health check failed', { error });
      return false;
    }
  }
}

export const saasApiClient = new SaaSApiClient();
