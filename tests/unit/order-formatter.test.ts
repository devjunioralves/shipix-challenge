import { OrderFormatter } from '../../src/modules/orders/services/order-formatter';
import { mockDailySummary, mockOrder } from '../helpers/mock-data';

describe('OrderFormatter Unit Tests', () => {
  let formatter: OrderFormatter;

  beforeEach(() => {
    formatter = new OrderFormatter();
  });

  describe('formatOrderDetails', () => {
    it('should format order details with all fields', () => {
      const formatted = formatter.formatOrderDetails(mockOrder);

      expect(formatted).toContain('📦 *Order');
      expect(formatted).toContain('Maria Santos');
      expect(formatted).toContain('Rua das Flores');
      expect(formatted).toContain('R$ 7.150,00');
      expect(formatted).toContain('Notebook Dell x2');
      expect(formatted).toContain('Mouse Logitech x1');
    });

    it('should handle orders without items', () => {
      const orderWithoutItems = { ...mockOrder, items: [] };
      const formatted = formatter.formatOrderDetails(orderWithoutItems);

      expect(formatted).toContain('📦 *Order');
      expect(formatted).not.toContain('Notebook');
    });

    it('should format addresses correctly', () => {
      const formatted = formatter.formatOrderDetails(mockOrder);

      expect(formatted).toContain('Rua das Flores, 123');
      expect(formatted).toContain('Apto 45');
      expect(formatted).toContain('Jardim Paulista');
      expect(formatted).toContain('São Paulo - SP');
      expect(formatted).toContain('01234-567');
    });

    it('should show delivery window when available', () => {
      const formatted = formatter.formatOrderDetails(mockOrder);

      expect(formatted).toContain('⏰ SCHEDULE');
    });

    it('should show notes when available', () => {
      const formatted = formatter.formatOrderDetails(mockOrder);

      expect(formatted).toContain('📝 NOTES');
      expect(formatted).toContain('Entregar na portaria');
    });
  });

  describe('formatDailySummary', () => {
    it('should format daily summary with statistics', () => {
      const formatted = formatter.formatDailySummary(mockDailySummary);

      expect(formatted).toContain("Today's Summary");
      expect(formatted).toContain(mockDailySummary.driverName);
      expect(formatted).toContain('5 deliveries');
      expect(formatted).toContain('Total:');
    });

    it('should handle summary with no orders', () => {
      const emptySummary = {
        ...mockDailySummary,
        totalOrders: 0,
        orders: [],
      };

      const formatted = formatter.formatDailySummary(emptySummary);

      expect(formatted).toContain('No deliveries');
    });

    it('should list urgent orders separately', () => {
      const formatted = formatter.formatDailySummary(mockDailySummary);

      if (mockDailySummary.urgentOrders > 0) {
        expect(formatted).toContain('ATTENTION');
      }
    });
  });

  describe('formatConfirmation', () => {
    it('should format delivery confirmation message', () => {
      const deliveredOrder = { ...mockOrder, status: 'delivered' as const };
      const formatted = formatter.formatConfirmation(deliveredOrder);

      expect(formatted).toContain('✅');
      expect(formatted).toContain('CONFIRMED');
      expect(formatted).toContain('order-1234');
    });

    it('should include customer name in confirmation', () => {
      const deliveredOrder = { ...mockOrder, status: 'delivered' as const };
      const formatted = formatter.formatConfirmation(deliveredOrder);

      expect(formatted).toContain('Maria Santos');
    });
  });

  describe('Edge Cases', () => {
    it('should handle orders with very long addresses', () => {
      const longAddressOrder = {
        ...mockOrder,
        address: {
          ...mockOrder.address,
          street: 'Rua'.repeat(50),
          complement: 'Complemento'.repeat(20),
        },
      };

      const formatted = formatter.formatOrderDetails(longAddressOrder);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should handle orders with special characters in names', () => {
      const specialCharOrder = {
        ...mockOrder,
        customer: {
          ...mockOrder.customer,
          name: "José & María São Paulo's Café",
        },
      };

      const formatted = formatter.formatOrderDetails(specialCharOrder);
      expect(formatted).toContain('José & María');
    });

    it('should handle decimal prices correctly', () => {
      const decimalOrder = {
        ...mockOrder,
        totalValue: 1234.56,
      };

      const formatted = formatter.formatOrderDetails(decimalOrder);
      expect(formatted).toContain('R$ 1.234,56');
    });
  });
});
