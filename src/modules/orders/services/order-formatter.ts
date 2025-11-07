import {
  formatAddressShort,
  formatCEP,
  formatCurrencyBR,
  formatDateBR,
  formatPhoneBR,
  formatTimeBR,
  getGreeting,
  getPriorityEmoji,
  getStatusEmoji,
} from '@/shared/utils/helpers';
import type { DailySummary, Order } from '@/shared/validators/schemas';

export class OrderFormatter {
  formatDailySummary(summary: DailySummary): string {
    const { driverName, totalOrders, orders, urgentOrders } = summary;

    if (totalOrders === 0) {
      return `${getGreeting()}, ${driverName}! 😊\n\n📅 No deliveries scheduled for today.\n\nEnjoy your day! 🎉`;
    }

    const sortedOrders = [...orders].sort((a, b) => {
      return (
        new Date(a.deliveryWindow.start).getTime() - new Date(b.deliveryWindow.start).getTime()
      );
    });
    const firstOrder = sortedOrders[0];
    const lastOrder = sortedOrders[sortedOrders.length - 1];

    let message = `${getGreeting()}, ${driverName}! 🌅\n\n`;
    message += `📦 *Today's Summary* (${formatDateBR(summary.date)}):\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Total: *${totalOrders} ${totalOrders === 1 ? 'delivery' : 'deliveries'}*\n\n`;

    if (urgentOrders > 0) {
      message += `🚨 *ATTENTION*: ${urgentOrders} urgent ${urgentOrders === 1 ? 'delivery' : 'deliveries'}!\n\n`;
    }

    message += `📍 *By region*:\n`;
    const regionCounts = orders.reduce(
      (acc, order) => {
        const region = order.address.neighborhood;
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.entries(regionCounts)
      .slice(0, 5) // Show top 5 regions
      .forEach(([region, count]) => {
        message += `• ${region}: ${count} ${count === 1 ? 'delivery' : 'deliveries'}\n`;
      });

    message += `\n⏰ *Schedule*:\n`;
    message += `First: ${formatTimeBR(firstOrder.deliveryWindow.start)} - ${formatAddressShort(firstOrder.address)}\n`;
    message += `Last: ${formatTimeBR(lastOrder.deliveryWindow.start)} - ${formatAddressShort(lastOrder.address)}\n\n`;

    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `💪 Good luck with your deliveries!\n\n`;
    message += `💬 Type *"List"* to see all orders\n`;
    message += `💬 Type *"Order #123"* for details`;

    return message;
  }

  formatOrderList(orders: Order[]): string {
    if (orders.length === 0) {
      return '📋 You have no pending orders at the moment.';
    }

    const urgent = orders.filter((o) => o.priority === 'urgent');
    const high = orders.filter((o) => o.priority === 'high');
    const normal = orders.filter((o) => o.priority === 'normal');

    let message = `📋 *YOUR ORDERS* (${orders.length} total)\n\n`;

    if (urgent.length > 0) {
      message += `🔴 *URGENT* (deliver as soon as possible)\n`;
      urgent.forEach((order) => {
        message += `• #${order.id} - ${formatAddressShort(order.address)}\n`;
        message += `  ⏰ ${formatTimeBR(order.deliveryWindow.start)}\n`;
      });
      message += `\n`;
    }

    if (high.length > 0) {
      message += `🟡 *HIGH PRIORITY*\n`;
      high.forEach((order) => {
        message += `• #${order.id} - ${formatAddressShort(order.address)}\n`;
        message += `  ⏰ ${formatTimeBR(order.deliveryWindow.start)}\n`;
      });
      message += `\n`;
    }

    if (normal.length > 0) {
      message += `🟢 *NORMAL*\n`;
      normal.slice(0, 10).forEach((order) => {
        message += `• #${order.id} - ${formatAddressShort(order.address)}\n`;
        message += `  ⏰ ${formatTimeBR(order.deliveryWindow.start)}\n`;
      });
      if (normal.length > 10) {
        message += `\n... and ${normal.length - 10} more orders\n`;
      }
    }

    message += `\n━━━━━━━━━━━━━━━━━━\n`;
    message += `💬 Type *"Order #123"* for details`;

    return message;
  }

  formatOrderDetails(order: Order): string {
    let message = `📦 *Order #${order.id}*\n`;
    message += `${getPriorityEmoji(order.priority)} ${order.priority === 'urgent' ? 'URGENT' : order.priority === 'high' ? 'HIGH PRIORITY' : 'NORMAL'}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;

    message += `🏠 *ADDRESS*\n`;
    message += `${order.address.street}, ${order.address.number}`;
    if (order.address.complement) {
      message += ` - ${order.address.complement}`;
    }
    message += `\n${order.address.neighborhood}, ${order.address.city} - ${order.address.state}\n`;
    message += `ZIP: ${formatCEP(order.address.zipcode)}\n\n`;

    message += `👤 *CUSTOMER*\n`;
    message += `Name: ${order.customer.name}\n`;
    message += `Phone: ${formatPhoneBR(order.customer.phone)}\n`;
    if (order.customer.notes) {
      message += `⚠️ Notes: ${order.customer.notes}\n`;
    }
    message += `\n`;

    message += `📋 *ITEMS*\n`;
    order.items.forEach((item) => {
      message += `• ${item.quantity}x ${item.name}\n`;
    });
    message += `\n*Total:* ${formatCurrencyBR(order.totalValue)}\n\n`;

    message += `⏰ *SCHEDULE*\n`;
    message += `Window: ${formatTimeBR(order.deliveryWindow.start)} - ${formatTimeBR(order.deliveryWindow.end)}\n`;
    message += `Status: ${getStatusEmoji(order.status)} ${this.translateStatus(order.status)}\n\n`;

    if (order.notes) {
      message += `📝 *NOTES*\n${order.notes}\n\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `✅ Confirm: Type *"Confirm #${order.id}"*\n`;
    message += `⚠️ Issue: Type *"Issue #${order.id}"*`;

    return message;
  }

  formatConfirmation(order: Order, nextOrder?: Order): string {
    let message = `✅ *CONFIRMED!*\n\n`;
    message += `Order #${order.id} marked as delivered\n\n`;
    message += `📝 *Details*:\n`;
    message += `• Customer: ${order.customer.name}\n`;
    message += `• Time: ${formatTimeBR(new Date())}\n`;
    message += `• Status: ✓ Delivered\n\n`;

    if (nextOrder) {
      message += `━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📦 *Next delivery*:\n`;
      message += `#${nextOrder.id} - ${formatAddressShort(nextOrder.address)}\n`;
      message += `⏰ ${formatTimeBR(nextOrder.deliveryWindow.start)}\n\n`;
      message += `Type *"Order #${nextOrder.id}"* for details`;
    } else {
      message += `━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🎉 *All deliveries completed!*\n`;
      message += `Great job today! 💪`;
    }

    return message;
  }

  formatEmergencyAlert(order: Order): string {
    let message = `🚨 *URGENT ALERT* 🚨\n\n`;
    message += `New priority order!\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📦 *Order #${order.id}*\n\n`;
    message += `🏠 ${formatAddressShort(order.address)}\n`;
    message += `${order.address.city} - ${order.address.state}\n\n`;
    message += `👤 Customer: ${order.customer.name}\n`;
    message += `📱 ${formatPhoneBR(order.customer.phone)}\n\n`;
    message += `⏰ Deliver by: ${formatTimeBR(order.deliveryWindow.end)}\n`;
    message += `💰 Amount: ${formatCurrencyBR(order.totalValue)}\n\n`;

    if (order.notes) {
      message += `⚠️ *ATTENTION*: ${order.notes}\n\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Type *"Order #${order.id}"* for complete details`;

    return message;
  }

  formatHelp(): string {
    return (
      `📱 *AVAILABLE COMMANDS*\n\n` +
      `📊 *QUERIES*\n` +
      `• "Summary" - Your daily summary\n` +
      `• "List" - All orders\n` +
      `• "Order #123" - Order details\n\n` +
      `✅ *ACTIONS*\n` +
      `• "Confirm #123" - Mark as delivered\n` +
      `• "Issue #123" - Report a problem\n\n` +
      `💡 *TIPS*\n` +
      `• Use # before the number: #1234\n` +
      `• You can ask naturally\n` +
      `• Ex: "What's the address for order 1234?"\n\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `🤖 I'm here to help!\n` +
      `Any questions, just ask.`
    );
  }

  formatError(message: string): string {
    return `❌ *Error*\n\n${message}\n\nIf the problem persists, contact support.`;
  }

  formatNotFound(orderId: string): string {
    return (
      `⚠️ *Order not found*\n\n` +
      `Order #${orderId} was not found.\n\n` +
      `Check the number and try again.\n` +
      `Type *"List"* to see your orders.`
    );
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed',
      cancelled: 'Cancelled',
      returned: 'Returned',
    };
    return translations[status] || status;
  }
}

export const orderFormatter = new OrderFormatter();
