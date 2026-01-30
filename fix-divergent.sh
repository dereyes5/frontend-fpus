#!/bin/bash

# Script para solucionar ramas divergentes en producción
# Ejecutar en el servidor cuando hay conflictos de git

echo "🔧 Solucionando ramas divergentes..."

# Ir al directorio del frontend
cd /opt/frontend || exit 1

echo "⏹️  Deteniendo aplicación..."
pm2 stop frontend-fpus || true

echo "🗑️  Descartando cambios locales..."
git reset --hard

echo "🧹 Limpiando stash..."
git stash clear

echo "📥 Configurando git..."
git config pull.rebase false

echo "🔄 Actualizando desde remoto..."
git fetch origin main
git reset --hard origin/main

echo "📦 Instalando dependencias..."
npm ci

echo "🏗️  Compilando..."
npm run build

echo "🚀 Reiniciando aplicación..."
pm2 restart frontend-fpus || pm2 start npm --name frontend-fpus -- run preview -- --host 0.0.0.0 --port 4173

pm2 save

echo "✅ Problema solucionado!"
pm2 status
