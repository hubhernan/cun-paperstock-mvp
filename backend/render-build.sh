#!/bin/bash
# Script de construcción para Render (Full-Stack)

# 1. Construir el Frontend
echo ">>> Construyendo el Frontend..."
cd ../frontend
npm install
npm run build

# 2. Construir el Backend
echo ">>> Construyendo el Backend..."
cd ../backend
npm install
npx prisma generate
