#!/bin/bash
echo "Starting Zenify Enhanced Suicide Detection System (Simplified)..."

# Kill any existing processes on our ports
echo "Stopping any existing processes..."
pkill -f "port 8001" 2>/dev/null || true
pkill -f "port 8002" 2>/dev/null || true
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:8002 | xargs kill -9 2>/dev/null || true

# Navigate to project root
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"

# Start MCP API (Machine Learning Classification Pipeline)
echo "Starting MCP API on port 8001..."
cd MCP
python3 -m venv venv_mcp 2>/dev/null || echo "Virtual environment already exists"
source venv_mcp/bin/activate
pip install -q fastapi uvicorn scikit-learn joblib 2>/dev/null || echo "Dependencies already installed"
uvicorn mcpapi:app --host 0.0.0.0 --port 8001 --reload &
MCP_PID=$!
echo "MCP API started with PID: $MCP_PID"
cd ..

# Start Simplified RAG API 
echo "Starting Simplified RAG API on port 8002..."
cd rag
python3 -m venv venv_rag 2>/dev/null || echo "Virtual environment already exists"
source venv_rag/bin/activate
pip install -q -r minimal_requirements.txt 2>/dev/null || echo "Dependencies already installed"
uvicorn simplified_suicide_detection_api:app --host 0.0.0.0 --port 8002 --reload &
RAG_PID=$!
echo "Simplified RAG API started with PID: $RAG_PID"
cd ..

# Wait a moment for APIs to start
sleep 3

# Check if APIs are running
echo "Checking API status..."
MCP_STATUS=$(curl -s http://localhost:8001/health 2>/dev/null || echo "Not responding")
RAG_STATUS=$(curl -s http://localhost:8002/health 2>/dev/null || echo "Not responding")

echo "=== API STATUS ==="
echo "MCP API (port 8001): $MCP_STATUS"
echo "RAG API (port 8002): $RAG_STATUS"
echo "=================="

if [[ "$MCP_STATUS" != "Not responding" ]] && [[ "$RAG_STATUS" != "Not responding" ]]; then
    echo "✅ All APIs are running successfully!"
    echo ""
    echo "🔗 Access the frontend at: http://localhost:5173"
    echo "🤖 MCP API docs: http://localhost:8001/docs"
    echo "🧠 RAG API docs: http://localhost:8002/docs"
    echo ""
    echo "To start the frontend:"
    echo "npm run dev"
    echo ""
    echo "To stop all APIs:"
    echo "pkill -f 'port 800'"
else
    echo "❌ Some APIs failed to start. Check the output above for errors."
fi

# Keep script running
wait
