#!/bin/bash

# Script para iniciar ambos servidores en desarrollo (para Linux/Mac)
# Para Windows, ejecutar en dos terminales separadas

echo "🚀 Iniciando Bitácora de Vehículos..."
echo ""

# Iniciar Backend
echo "📦 Backend (Puerto 3000)..."
cd BitacoraTacna-Backend
npm run dev &
BACKEND_PID=$!

# Esperar a que el backend inicie
sleep 3

# Iniciar Frontend
echo "⚛️  Frontend (Puerto 5173)..."
cd ../BitacoraTacna
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Ambos servidores están iniciados:"
echo "   🔗 Frontend:  http://localhost:5173"
echo "   🔗 Backend:   http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener..."
echo ""

# Mantener ambos procesos activos
wait
