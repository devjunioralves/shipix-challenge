const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.json());

const mockDrivers = {
  'driver-123': {
    id: 'driver-123',
    name: 'João Silva',
    phone: '5511999999999',
    status: 'active',
  },
  'driver-456': {
    id: 'driver-456',
    name: 'Maria Santos',
    phone: '5511988888888',
    status: 'active',
  },
};

const mockOrders = {
  'order-1234': {
    id: 'order-1234',
    orderNumber: 'order-1234',
    driverId: 'driver-123',
    status: 'pending',
    priority: 'normal',
    customer: {
      id: 'customer-001',
      name: 'Cliente Test',
      phone: '5511977777777',
      notes: 'Ring the doorbell',
    },
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apt 45',
      neighborhood: 'Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01234567',
    },
    items: [
      { id: 'item-001', name: 'Product A', quantity: 2, price: 50.0 },
      { id: 'item-002', name: 'Product B', quantity: 1, price: 30.0 },
    ],
    totalValue: 130.0,
    deliveryWindow: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString(),
    },
    notes: 'Handle with care',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'order-5678': {
    id: 'order-5678',
    orderNumber: 'order-5678',
    driverId: 'driver-123',
    status: 'pending',
    priority: 'high',
    customer: {
      id: 'customer-002',
      name: 'João Silva',
      phone: '5511988888888',
    },
    address: {
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01310100',
    },
    items: [{ id: 'item-003', name: 'Product C', quantity: 1, price: 100.0 }],
    totalValue: 100.0,
    deliveryWindow: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 7200000).toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/drivers/:driverId', (req, res) => {
  const driver = mockDrivers[req.params.driverId];
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }
  res.json({ driver });
});

app.get('/drivers/:driverId/orders', (req, res) => {
  const driverId = req.params.driverId;
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const orders = Object.values(mockOrders).filter((order) => order.driverId === driverId);

  console.log(`📦 Fetching orders for driver ${driverId} on ${date}`);
  console.log(`   Found ${orders.length} orders`);

  res.json({ orders });
});

app.get('/orders/:orderId', (req, res) => {
  const order = mockOrders[req.params.orderId];
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  console.log(`📋 Fetching order ${req.params.orderId}`);
  res.json({ order });
});

app.post('/orders/:orderId/confirm', (req, res) => {
  const order = mockOrders[req.params.orderId];
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = 'delivered';
  order.deliveredAt = new Date().toISOString();
  order.deliveryNotes = req.body.notes;
  order.photoUrl = req.body.photoUrl;

  console.log(`✅ Order ${req.params.orderId} marked as delivered`);
  console.log(`   Notes: ${req.body.notes || 'none'}`);

  res.json({ order });
});

app.post('/orders/:orderId/issues', (req, res) => {
  const order = mockOrders[req.params.orderId];
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const issue = {
    id: `issue-${Date.now()}`,
    orderId: req.params.orderId,
    issueType: req.body.issueType,
    description: req.body.description,
    reportedAt: new Date().toISOString(),
  };

  console.log(`⚠️  Issue reported for order ${req.params.orderId}`);
  console.log(`   Type: ${req.body.issueType}`);
  console.log(`   Description: ${req.body.description}`);

  res.status(201).json({ success: true, issue });
});

app.patch('/orders/:orderId/status', (req, res) => {
  const order = mockOrders[req.params.orderId];
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = req.body.status;
  console.log(`🔄 Order ${req.params.orderId} status updated to ${req.body.status}`);

  res.json({ order });
});

app.get('/drivers/:driverId', (req, res) => {
  const driver = mockDrivers[req.params.driverId];
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }
  res.json({ driver });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Mock SaaS API Server running!');
  console.log('');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   GET  /health`);
  console.log(`   GET  /drivers/:driverId`);
  console.log(`   GET  /drivers/:driverId/orders`);
  console.log(`   GET  /orders/:orderId`);
  console.log(`   POST /orders/:orderId/confirm`);
  console.log(`   POST /orders/:orderId/issues`);
  console.log(`   PATCH /orders/:orderId/status`);
  console.log('');
  console.log('🧪 Test data:');
  console.log(`   Driver IDs: ${Object.keys(mockDrivers).join(', ')}`);
  console.log(`   Order IDs: ${Object.keys(mockOrders).join(', ')}`);
  console.log('');
  console.log('💡 Set this in your .env file:');
  console.log(`   SAAS_API_BASE_URL=http://localhost:${PORT}`);
  console.log('');
});
