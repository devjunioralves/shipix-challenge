echo ""
echo "🛑 Stopping all services..."
echo ""

kill_port() {
    local pid=$(lsof -ti :$1 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "   Stopping service on port $1 (PID: $pid)..."
        kill -9 $pid 2>/dev/null
        sleep 1
        echo "   ✅ Stopped"
    else
        echo "   ℹ️  No service running on port $1"
    fi
}


echo "Checking ports..."
echo ""

kill_port 4000
kill_port 5000
kill_port 3005
kill_port 5678

echo ""
echo "Checking process names..."
echo ""

processes=("mock-saas-api" "mock-whatsapp-api" "n8n")
for proc in "${processes[@]}"; do
    pids=$(pgrep -f "$proc")
    if [ -n "$pids" ]; then
        echo "   Stopping $proc (PIDs: $pids)..."
        pkill -9 -f "$proc" 2>/dev/null
        echo "   ✅ Stopped"
    fi
done

echo ""
echo "✨ All services stopped!"
echo ""
echo "📝 Logs preserved in /tmp/"
echo "   • /tmp/mock-saas.log"
echo "   • /tmp/mock-whatsapp.log"
echo "   • /tmp/app.log"
echo "   • /tmp/n8n.log"
echo ""
