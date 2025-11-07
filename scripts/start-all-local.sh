echo ""
echo "🚀 Starting all services locally..."
echo ""

port_in_use() {
    lsof -i :$1 > /dev/null 2>&1
}

kill_port() {
    local pid=$(lsof -ti :$1 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "   ⚠️  Port $1 is in use by PID $pid. Killing..."
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

echo "🧹 Checking and cleaning ports..."
echo ""

for port in 3005 4000 5000 5678; do
    if port_in_use $port; then
        kill_port $port
    fi
done

echo "✅ Ports cleaned"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Mock SaaS API
echo "1️⃣  Starting Mock SaaS API (port 4000)..."
node scripts/mock-saas-api.js > /tmp/mock-saas.log 2>&1 &
saas_pid=$!
sleep 2

if port_in_use 4000; then
    echo "   ✅ Mock SaaS running (PID: $saas_pid)"
else
    echo "   ❌ Failed to start Mock SaaS"
    exit 1
fi
echo ""

# Start Mock WhatsApp API
echo "2️⃣  Starting Mock WhatsApp API (port 5000)..."
node scripts/mock-whatsapp-api.js > /tmp/mock-whatsapp.log 2>&1 &
whatsapp_pid=$!
sleep 2

if port_in_use 5000; then
    echo "   ✅ Mock WhatsApp running (PID: $whatsapp_pid)"
else
    echo "   ❌ Failed to start Mock WhatsApp"
    exit 1
fi
echo ""

# Start Your App
echo "3️⃣  Starting Your App (port 3005)..."
npm run dev > /tmp/app.log 2>&1 &
app_pid=$!
sleep 3

if port_in_use 3005; then
    echo "   ✅ Your App running (PID: $app_pid)"
else
    echo "   ⚠️  App may not be running on port 3005"
fi
echo ""

# Start n8n
echo "4️⃣  Starting n8n (port 5678)..."
echo "   (This may take a moment on first run...)"
npx n8n > /tmp/n8n.log 2>&1 &
n8n_pid=$!
sleep 5

if port_in_use 5678; then
    echo "   ✅ n8n running (PID: $n8n_pid)"
else
    echo "   ⚠️  n8n may still be starting..."
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ All services started!"
echo ""
echo "📋 Service URLs:"
echo "   • Mock SaaS API:    http://localhost:4000"
echo "   • Mock WhatsApp:    http://localhost:5000"
echo "   • Your App:         http://localhost:3005"
echo "   • n8n:              http://localhost:5678"
echo ""
echo "🔑 n8n Login:"
echo "   • URL:      http://localhost:5678"
echo "   • User:     owner@example.com (first time setup)"
echo ""
echo "📝 Process IDs:"
echo "   • Mock SaaS:    $saas_pid"
echo "   • Mock WhatsApp: $whatsapp_pid"
echo "   • Your App:     $app_pid"
echo "   • n8n:          $n8n_pid"
echo ""
echo "📊 View logs:"
echo "   • tail -f /tmp/mock-saas.log"
echo "   • tail -f /tmp/mock-whatsapp.log"
echo "   • tail -f /tmp/app.log"
echo "   • tail -f /tmp/n8n.log"
echo ""
echo "🛑 Stop all services:"
echo "   • ./scripts/stop-all-services.fish"
echo "   or manually: kill $saas_pid $whatsapp_pid $app_pid $n8n_pid"
echo ""
echo "🧪 Test endpoints:"
echo "   • curl http://localhost:4000/health"
echo "   • curl http://localhost:5000/health"
echo "   • curl http://localhost:3005/health"
echo "   • curl http://localhost:3005/api/orders/daily-summary/driver-123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Next steps:"
echo "   1. Open n8n: http://localhost:5678"
echo "   2. Import workflows from: n8n-workflows/"
echo "   3. In workflows, use: http://localhost:3005 (no Docker IPs needed!)"
echo "   4. Execute workflows manually to test"
echo ""
echo "🎉 Ready to go!"
echo ""
