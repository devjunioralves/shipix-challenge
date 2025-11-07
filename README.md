# 🚚 Shipix - WhatsApp Driver Integration

WhatsApp integration for logistics drivers to manage deliveries without installing apps. Integrates with existing SaaS platforms via n8n automation.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: PORT=3005, SAAS_API_BASE_URL=http://localhost:4000, WHATSAPP_API_URL=http://localhost:5000

# 3. Start all services
./scripts/start-all-local.sh

# 4. Stop all services
./scripts/stop-all-services.sh
```

**Services running:**

- Your App: http://localhost:3005
- Mock SaaS: http://localhost:4000
- Mock WhatsApp: http://localhost:5000
- n8n: http://localhost:5678

---

## 🏗️ Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   WhatsApp   │───▶│     n8n      │───▶│   Your App   │
│   (Driver)   │◀───│  (Workflows) │◀───│  (Port 3005) │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                                │
                                                v
                                         ┌──────────────┐
                                         │   SaaS API   │
                                         └──────────────┘
```

**Components:**

- **Your App** (3005): REST API, validation, formatting
- **n8n** (5678): Workflow automation, scheduling
- **Mock SaaS** (4000): External order management (for testing)
- **Mock WhatsApp** (5000): WhatsApp gateway (for testing)

---

## 🧪 Testing

```bash
# Health checks
curl http://localhost:3005/health
curl http://localhost:4000/health
curl http://localhost:5000/health

# Get daily summary
curl http://localhost:3005/api/orders/daily-summary/driver-123 | jq

# Confirm delivery
curl -X POST http://localhost:3005/api/orders/confirm \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order-1234", "notes": "Delivered"}'

# Check messages sent
curl http://localhost:5000/debug/messages | jq
```

**Test data:** `driver-123`, `driver-456`, `order-1234`, `order-5678`

---

## 🤖 n8n Workflows

### Setup

1. **Access n8n:** http://localhost:5678 (create account first time)
2. **Import workflows:** Workflows → Import from file
   - `n8n-workflows/01-daily-summary-scheduler.json`
   - `n8n-workflows/02-order-confirmation-processor.json`
   - `n8n-workflows/03-emergency-order-alerts.json`
3. **Update URLs:** In each workflow, set HTTP Request nodes to `http://localhost:3005/api/...`
4. **Test:** Click "Execute Workflow" button
5. **Activate:** Toggle "Active" switch ON

### What each workflow does

**1. Daily Summary Scheduler**

- Runs: 6:00 AM daily
- Sends: Delivery list to drivers via WhatsApp

**2. Order Confirmation Processor**

- Trigger: Webhook when order delivered
- Action: Sends confirmation to customer

**3. Emergency Order Alerts**

- Runs: Every 15 minutes
- Alerts: Urgent/delayed orders

### Why n8n?

- ✅ Visual workflow editor (no code)
- ✅ Built-in scheduling & webhooks
- ✅ Automatic retries & error handling
- ✅ Quick changes without redeployment

---

## 📝 API Endpoints

| Method | Endpoint                              | Description      |
| ------ | ------------------------------------- | ---------------- |
| GET    | `/health`                             | Health check     |
| GET    | `/api/orders/daily-summary/:driverId` | Get daily orders |
| POST   | `/api/orders/confirm`                 | Confirm delivery |
| POST   | `/api/orders/issue`                   | Report problem   |
| POST   | `/webhook/whatsapp`                   | WhatsApp webhook |
| POST   | `/webhook/n8n`                        | n8n webhook      |

---

## 📁 Project Structure

```
src/
├── config/                    # Environment config
├── modules/orders/
│   └── services/
│       ├── saas-api-client.ts # External API client
│       └── order-formatter.ts # Message formatting
└── shared/
    ├── infrastructure/logger.ts
    └── validators/schemas.ts  # Zod validation

scripts/
├── mock-saas-api.js          # Mock SaaS for testing
├── mock-whatsapp-api.js      # Mock WhatsApp for testing
├── start-all-local.fish      # Start all services
└── stop-all-services.fish    # Stop all services

n8n-workflows/                # Automation workflows (import to n8n)
```

---

## ⚙️ Configuration

### Local Development (.env)

```env
PORT=3005
NODE_ENV=development
SAAS_API_BASE_URL=http://localhost:4000
WHATSAPP_API_URL=http://localhost:5000
```

### Production (.env)

```env
PORT=3000
NODE_ENV=production
SAAS_API_BASE_URL=https://api.yourplatform.com
SAAS_API_KEY=your_api_key
WHATSAPP_API_URL=http://evolution-api:8080
WHATSAPP_API_KEY=your_key
```

---

## 🐛 Troubleshooting

### Services won't start

```bash
./scripts/stop-all-services.sh
./scripts/start-all-local.sh
```

### Port already in use

```bash
lsof -ti :3005 | xargs kill -9
```

### n8n can't connect to app

- **Local n8n:** Use `http://localhost:3005`
- **Docker n8n:** Use `http://172.17.0.1:3005` (Linux) or `http://host.docker.internal:3005` (Mac/Win)

### Zod validation errors

Check mock data has required fields: `customer.id`, `items[].id`, `updatedAt`

### View logs

```bash
tail -f /tmp/app.log
tail -f /tmp/mock-saas.log
tail -f /tmp/mock-whatsapp.log
tail -f /tmp/n8n.log
```

---

## 🛠️ Development

```bash
npm run dev           # Start app in dev mode
npm test              # Run tests
npm run test:coverage # Test coverage
npm run lint          # Lint code
npm run build         # Build for production
```

---

## 🤖 AI Prompts Used in Development

### Create Mock APIs

```
Create a mock SaaS API server with Express.js that simulates an order management system.
Include endpoints for:
- GET /drivers/:driverId - Get driver information
- GET /drivers/:driverId/orders - Get driver's orders
- GET /orders/:orderId - Get specific order details
- POST /orders/:orderId/confirm - Confirm delivery
- POST /orders/:orderId/issues - Report issue

Include realistic test data with:
- Driver information (id, name, phone)
- Orders with customer details (id, name, phone, address)
- Order items (id, name, quantity, price)
- All required fields for Zod validation (customer.id, items[].id, updatedAt)

Use port 4000 and display startup info with available endpoints.
```

```
Create a mock WhatsApp API server that simulates Evolution API.
Include:
- POST /message/sendText - Send text message
- GET /health - Health check
- GET /debug/messages - Return all sent messages for testing

```

### Setup Scripts

```
Create a bash script that starts all services for local development:
- Mock SaaS API (port 4000)
- Mock WhatsApp API (port 5000)
- Main application (port 3005)
- n8n (port 5678)

```

---

## 📚 Tech Stack

- Node.js 18+ + TypeScript 5.3
- Express.js + Zod validation
- n8n (automation)
- Docker + Docker Compose

---

## 📄 License

MIT
