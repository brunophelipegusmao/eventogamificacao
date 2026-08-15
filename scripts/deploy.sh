#!/usr/bin/env bash
# Deploy da app. Roda NA VPS, de dentro do diretório do projeto:
#
#   cd ~/apps/evento-gamificacao && ./scripts/deploy.sh
#
# ou disparado remotamente do seu laptop:
#
#   ssh sua-vps 'cd ~/apps/evento-gamificacao && ./scripts/deploy.sh'
#
# Pressupõe que scripts/vps-setup.sh já rodou (Docker, Postgres, Nginx,
# .env.production preenchido).

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

COMPOSE=(docker compose --env-file .env.production -f docker-compose.prod.yml)
APP_URL="${HEALTHCHECK_URL:-http://127.0.0.1:3300}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
die() { printf '\n\033[1;31mERRO: %s\033[0m\n' "$1" >&2; exit 1; }

[ -f .env.production ] || die ".env.production não encontrado em $REPO_DIR (copie de .env.production.example e preencha)."

log "Atualizando código (main)"
git fetch origin main
git checkout main
git reset --hard origin/main

log "Buildando imagens (app + migrate)"
"${COMPOSE[@]}" build

log "Rodando migrations do banco"
# --build: o serviço migrate fica atrás de `profiles: [tools]`, então o
# `compose build` acima (sem --profile) pula ele e reaproveitaria uma imagem
# `:builder` desatualizada sem as migrations mais recentes.
"${COMPOSE[@]}" run --build --rm migrate

log "Subindo a aplicação"
"${COMPOSE[@]}" up -d app

log "Checando saúde da aplicação em $APP_URL"
ok=""
for i in $(seq 1 10); do
  if curl -fsS -o /dev/null "$APP_URL"; then
    ok=1
    break
  fi
  sleep 2
done

if [ -z "$ok" ]; then
  echo "Healthcheck falhou. Últimas linhas do log do container:"
  "${COMPOSE[@]}" logs --tail=50 app
  die "deploy possivelmente quebrado — app não respondeu em $APP_URL após 20s."
fi

log "Limpando imagens antigas"
docker image prune -f

log "Deploy concluído com sucesso"
"${COMPOSE[@]}" ps app
