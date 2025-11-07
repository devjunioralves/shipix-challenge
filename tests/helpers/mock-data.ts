import type { Order } from '../../src/shared/validators/schemas';

export const mockDriver = {
  id: 'driver-123',
  name: 'João Silva',
  phone: '+5511987654321',
  vehicleType: 'van',
  region: 'zona-norte',
  status: 'available' as const,
};

export const mockOrder: Order = {
  id: 'order-1234',
  driverId: 'driver-123',
  status: 'pending',
  priority: 'urgent',
  customer: {
    id: 'customer-456',
    name: 'Maria Santos',
    phone: '+5511912345678',
  },
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Jardim Paulista',
    city: 'São Paulo',
    state: 'SP',
    zipcode: '01234-567',
    coordinates: {
      latitude: -23.5505,
      longitude: -46.6333,
    },
  },
  items: [
    {
      id: 'item-1',
      name: 'Notebook Dell',
      quantity: 2,
      price: 3500.0,
    },
    {
      id: 'item-2',
      name: 'Mouse Logitech',
      quantity: 1,
      price: 150.0,
    },
  ],
  totalValue: 7150.0,
  deliveryWindow: {
    start: '2025-11-06T14:00:00.000Z',
    end: '2025-11-06T17:00:00.000Z',
  },
  notes: 'Entregar na portaria, avisar por interfone.',
  createdAt: '2025-11-06T08:00:00.000Z',
  updatedAt: '2025-11-06T08:00:00.000Z',
};

export const mockOrders: Order[] = [
  mockOrder,
  {
    ...mockOrder,
    id: 'order-1235',
    priority: 'high',
    customer: {
      id: 'customer-457',
      name: 'Pedro Costa',
      phone: '+5511923456789',
    },
    address: {
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01310-100',
    },
    items: [
      {
        id: 'item-3',
        name: 'Teclado Mecânico',
        quantity: 1,
        price: 500.0,
      },
    ],
    totalValue: 500.0,
  },
  {
    ...mockOrder,
    id: 'order-1236',
    priority: 'normal',
    status: 'delivered',
    customer: {
      id: 'customer-458',
      name: 'Ana Lima',
      phone: '+5511934567890',
    },
    totalValue: 250.0,
  },
];

export const mockDailySummary = {
  date: new Date().toISOString(),
  driverId: mockDriver.id,
  driverName: mockDriver.name,
  totalOrders: 5,
  completedOrders: 2,
  pendingOrders: 3,
  urgentOrders: 1,
  orders: mockOrders,
};

export const mockHealthResponse = {
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: 100,
  environment: 'test',
  version: '1.0.0',
  services: {
    saasApi: 'ok',
  },
};

export const mockWhatsAppMessage = {
  key: {
    remoteJid: '5511987654321@s.whatsapp.net',
    fromMe: false,
    id: 'msg-123',
  },
  message: {
    conversation: 'Details #1234',
  },
  messageTimestamp: Date.now(),
  pushName: 'João Silva',
};

export const mockConfirmationMessage = {
  key: {
    remoteJid: '5511987654321@s.whatsapp.net',
    fromMe: false,
    id: 'msg-124',
  },
  message: {
    conversation: 'Confirm #1234',
  },
  messageTimestamp: Date.now(),
  pushName: 'João Silva',
};

export const mockIssueReport = {
  orderId: 'order-1234',
  issueType: 'customer_absent',
  description: 'Customer is not home, phone is off.',
};
