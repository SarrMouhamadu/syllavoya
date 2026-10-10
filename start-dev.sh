#!/usr/bin/env bash

set -e

# Se positionner dans le répertoire racine du projet
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=========================================================="
echo "      🚀 DÉMARRAGE DE SYLLA VOYAGE EN LOCALHOST           "
echo "=========================================================="

# Fonction de nettoyage lors de l'arrêt (Ctrl+C)
cleanup() {
  echo ""
  echo "🛑 Arrêt des serveurs en cours..."
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
  wait "$API_PID" 2>/dev/null || true
  wait "$WEB_PID" 2>/dev/null || true
  echo "✅ Serveurs arrêtés proprement."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Vérification de PostgreSQL (port 5432)
echo "🔍 Vérification de la base de données..."
if nc -z 127.0.0.1 5432 2>/dev/null; then
  echo "   ✓ PostgreSQL est actif sur le port 5432."
else
  echo "   ⚠️  PostgreSQL n'est pas joignable sur le port 5432."
  if command -v docker >/dev/null 2>&1; then
    echo "   🐳 Tentative de démarrage du conteneur PostgreSQL via Docker..."
    docker compose up -d postgres
    sleep 3
  else
    echo "   ❌ Veuillez démarrer votre serveur PostgreSQL avant de continuer."
    exit 1
  fi
fi

# 2. Vérification des dépendances et de Prisma dans apps/api
echo ""
echo "⚙️  Préparation du Backend (apps/api)..."
cd "$ROOT_DIR/apps/api"
if [ ! -d "node_modules" ]; then
  echo "   📦 Installation des dépendances API..."
  npm install
fi

echo "   🔄 Synchronisation du client Prisma..."
npx prisma generate > /dev/null 2>&1 || true

# 3. Vérification des dépendances dans apps/web
echo ""
echo "🎨 Préparation du Frontend (apps/web)..."
cd "$ROOT_DIR/apps/web"
if [ ! -d "node_modules" ]; then
  echo "   📦 Installation des dépendances Web..."
  npm install
fi

# 4. Lancement des serveurs
echo ""
echo "=========================================================="
echo "   🟢 Lancement des services :"
echo "   • Backend API  : http://localhost:3001"
echo "   • Frontend Web : http://localhost:5173"
echo "   (Appuyez sur Ctrl+C pour arrêter tous les serveurs)"
echo "=========================================================="
echo ""

# Démarrer l'API en arrière-plan
cd "$ROOT_DIR/apps/api"
npm run dev &
API_PID=$!

# Attendre que l'API commence à écouter
sleep 2

# Démarrer le Frontend en arrière-plan
cd "$ROOT_DIR/apps/web"
npm run dev &
WEB_PID=$!

# Attendre que les deux processus continuent de tourner
wait
