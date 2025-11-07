const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

const sentMessages = [];

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', instance: 'shipix-driver-app' });
});

app.get('/instance/connectionState/:instanceName', (req, res) => {
  console.log(`📱 Checking instance: ${req.params.instanceName}`);
  res.json({
    instance: req.params.instanceName,
    state: 'open',
    statusReason: 200,
  });
});

app.post('/message/sendText/:instanceName', (req, res) => {
  const { number, text } = req.body;

  const message = {
    id: `msg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    instance: req.params.instanceName,
    to: number,
    text: text,
  };

  sentMessages.push(message);

  console.log('');
  console.log('📤 MESSAGE SENT:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${number}`);
  console.log(`Instance: ${req.params.instanceName}`);
  console.log('');
  console.log('Content:');
  console.log(text);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  res.json({
    key: {
      remoteJid: `${number}@s.whatsapp.net`,
      fromMe: true,
      id: message.id,
    },
    message: {
      conversation: text,
    },
    messageTimestamp: Date.now(),
    status: 'PENDING',
  });
});

app.post('/message/sendMedia/:instanceName', (req, res) => {
  const { number, mediatype, media, caption } = req.body;

  const message = {
    id: `msg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    instance: req.params.instanceName,
    to: number,
    type: mediatype,
    media: media,
    caption: caption,
  };

  sentMessages.push(message);

  console.log('');
  console.log('📤 MEDIA MESSAGE SENT:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${number}`);
  console.log(`Type: ${mediatype}`);
  console.log(`Caption: ${caption || 'none'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  res.json({
    key: {
      remoteJid: `${number}@s.whatsapp.net`,
      fromMe: true,
      id: message.id,
    },
    messageTimestamp: Date.now(),
    status: 'PENDING',
  });
});

app.post('/webhook', (req, res) => {
  console.log('');
  console.log('📥 WEBHOOK RECEIVED:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  res.json({ success: true });
});

app.get('/debug/messages', (req, res) => {
  res.json({
    total: sentMessages.length,
    messages: sentMessages,
  });
});

app.delete('/debug/messages', (req, res) => {
  const count = sentMessages.length;
  sentMessages.length = 0;
  console.log(`🗑️  Cleared ${count} messages`);
  res.json({ cleared: count });
});

app.post('/debug/simulate-message', (req, res) => {
  const { from, message, orderId } = req.body;

  const webhookPayload = {
    event: 'messages.upsert',
    instance: 'shipix-driver-app',
    data: {
      key: {
        remoteJid: `${from || '5511999999999'}@s.whatsapp.net`,
        fromMe: false,
        id: `msg-${Date.now()}`,
      },
      message: {
        conversation: message || `Confirm #${orderId || '1234'}`,
      },
      messageTimestamp: Date.now(),
    },
  };

  console.log('');
  console.log('🔔 SIMULATING INCOMING MESSAGE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`From: ${from || '5511999999999'}`);
  console.log(`Message: ${message || `Confirm #${orderId || '1234'}`}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Send this payload to your app webhook endpoint:');
  console.log(JSON.stringify(webhookPayload, null, 2));
  console.log('');

  res.json({
    success: true,
    webhookPayload,
    tip: 'Use this payload with: POST http://localhost:3000/webhook/whatsapp',
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('📱 Mock WhatsApp API Server running!');
  console.log('');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   GET  /health`);
  console.log(`   GET  /instance/connectionState/:instanceName`);
  console.log(`   POST /message/sendText/:instanceName`);
  console.log(`   POST /message/sendMedia/:instanceName`);
  console.log(`   POST /webhook`);
  console.log('');
  console.log('🧪 Debug endpoints:');
  console.log(`   GET    /debug/messages - List all sent messages`);
  console.log(`   DELETE /debug/messages - Clear message history`);
  console.log(`   POST   /debug/simulate-message - Simulate incoming message`);
  console.log('');
  console.log('💡 Set this in your .env file:');
  console.log(`   WHATSAPP_API_URL=http://localhost:${PORT}`);
  console.log(`   WHATSAPP_INSTANCE_NAME=shipix-driver-app`);
  console.log('');
});
