#!/bin/bash

# Script de deployment automático para el Frontend (Vite)
# Uso esperado en la VM:
#   cd /opt/frontend
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Este script sigue el mismo patrón que el backend:
# - pm2 stop
# - git stash
# - git pull
# - git stash pop
# - npm install
# - npm run build
# - pm2 restart || pm2 start

set -e

APP_DIR="/opt/frontend"
APP_NAME="frontend-fpus"
BRANCH="main"
PREVIEW_HOST="0.0.0.0"
PREVIEW_PORT="4173"

echo "🚀 Iniciando deployment del frontend..."

# Preferir /opt/frontend (si existe), sino usar carpeta del script
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
else
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  cd "$SCRIPT_DIR"
fi

if ! command -v git >/dev/null 2>&1; then
  echo "❌ git no está instalado"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm no está instalado"
  exit 1
fi

echo "⏹️  Deteniendo aplicación..."
pm2 stop "$APP_NAME" || true

echo "💾 Guardando cambios locales..."
git stash || true

echo "📥 Descargando cambios..."
# Configurar git para hacer rebase en caso de divergencia
git config pull.rebase false

# Intentar pull normal primero
if ! git pull origin "$BRANCH"; then
  echo "⚠️  Detectadas ramas divergentes, forzando actualización desde remoto..."
  # Si falla, resetear al estado del remoto
  git fetch origin "$BRANCH"
  git reset --hard origin/"$BRANCH"
fi

echo "💾 Restaurando cambios locales si existían..."
git stash pop || true

echo "📦 Instalando dependencias..."
if [ -f "package-lock.json" ]; then
  npm ci
else
  npm install
fi

echo "🏗️  Compilando (dist)..."
npm run build

echo "🔄 Reiniciando aplicación..."
# Nota: esto sirve el build con vite preview.
# Si usas Nginx, ignora el pm2 start y configura Nginx apuntando a ./dist.
pm2 restart "$APP_NAME" || pm2 start npm --name "$APP_NAME" -- run preview -- --host "$PREVIEW_HOST" --port "$PREVIEW_PORT"

pm2 save

echo "✅ Deployment completado exitosamente!"
pm2 status
echo "🌐 Frontend: http://$PREVIEW_HOST:$PREVIEW_PORT (vite preview)"
