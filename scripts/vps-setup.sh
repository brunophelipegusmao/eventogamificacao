#!/usr/bin/env bash
# Bootstrap ÚNICO da VPS (Ubuntu/Debian) para hospedar a app.
# Idempotente: pode ser reexecutado com segurança (cada etapa checa se já
# foi feita), mas foi desenhado pra rodar uma vez numa VPS nova.
#
# Depois de terminar, use scripts/deploy.sh a cada novo deploy.
#
# Uso:
#   ssh sua-vps
#   curl -fsSL https://raw.githubusercontent.com/brunophelipegusmao/eventogamificacao/main/scripts/vps-setup.sh -o vps-setup.sh
#   LETSENCRYPT_EMAIL=seu@email.com bash vps-setup.sh
#
# (ou clone o repo manualmente e rode ./scripts/vps-setup.sh de dentro dele)

set -euo pipefail

# ===== Config (sobrescreva via env var antes de rodar, se precisar) =====
DOMAIN="${DOMAIN:-gameficacao.brunogusmao.dev}"
APP_DIR="${APP_DIR:-$HOME/apps/evento-gamificacao}"
REPO_URL="${REPO_URL:-https://github.com/brunophelipegusmao/eventogamificacao.git}"
DB_NAME="${DB_NAME:-gamif_evento_prod}"
DB_USER="${DB_USER:-gamif_prod}"
DOCKER_SUBNET="${DOCKER_SUBNET:-172.28.0.0/24}"
PG_VERSION="${PG_VERSION:-17}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"

# Só usa sudo se não estiver rodando como root.
SUDO="sudo"
[ "$(id -u)" = "0" ] && SUDO=""

# Gateway assumido pra subnet fixa do compose (é sempre .1 pra um /24 do Docker).
DOCKER_GATEWAY="${DOCKER_SUBNET%.0/24}.1"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

log "Config: DOMAIN=$DOMAIN APP_DIR=$APP_DIR DB_NAME=$DB_NAME DB_USER=$DB_USER"

# ===== 1. Pacotes base =====
log "Atualizando apt e instalando pré-requisitos"
$SUDO apt-get update -y
$SUDO apt-get install -y ca-certificates curl gnupg git ufw openssl

# ===== 2. Docker Engine + compose plugin =====
if ! command -v docker &>/dev/null; then
  log "Instalando Docker Engine"
  $SUDO install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null
  $SUDO apt-get update -y
  $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  log "Docker já instalado, pulando"
fi

if ! id -nG "$USER" | grep -qw docker; then
  log "Adicionando $USER ao grupo docker (efetivo só no próximo login/shell)"
  $SUDO usermod -aG docker "$USER"
  NEEDS_RELOGIN=1
fi

# ===== 3. PostgreSQL nativo (repo oficial PGDG, versão fixa) =====
if ! command -v psql &>/dev/null; then
  log "Instalando PostgreSQL ${PG_VERSION}"
  $SUDO install -d /usr/share/postgresql-common/pgdg
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | $SUDO gpg --dearmor -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg] http://apt.postgresql.org/pub/repos/apt $(. /etc/os-release && echo "$VERSION_CODENAME")-pgdg main" \
    | $SUDO tee /etc/apt/sources.list.d/pgdg.list >/dev/null
  $SUDO apt-get update -y
  $SUDO apt-get install -y "postgresql-${PG_VERSION}"
else
  log "PostgreSQL já instalado, pulando"
fi

# ===== 4. Postgres: aceitar conexões vindas do container (subnet fixa) =====
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

log "Configurando Postgres para aceitar conexões de ${DOCKER_SUBNET} (gateway ${DOCKER_GATEWAY})"
if $SUDO grep -q "^listen_addresses" "$PG_CONF"; then
  $SUDO sed -i "s/^listen_addresses.*/listen_addresses = 'localhost,${DOCKER_GATEWAY}'/" "$PG_CONF"
else
  echo "listen_addresses = 'localhost,${DOCKER_GATEWAY}'" | $SUDO tee -a "$PG_CONF" >/dev/null
fi

if ! $SUDO grep -q "$DOCKER_SUBNET" "$PG_HBA"; then
  echo "host    ${DB_NAME}    ${DB_USER}    ${DOCKER_SUBNET}    scram-sha-256" | $SUDO tee -a "$PG_HBA" >/dev/null
fi

$SUDO systemctl enable postgresql --now
$SUDO systemctl restart postgresql

# ===== 5. Role + database de produção =====
DB_PASSWORD_GENERATED=""
if ! $SUDO -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  log "Criando role ${DB_USER}"
  DB_PASSWORD_GENERATED="$(openssl rand -base64 24)"
  $SUDO -u postgres psql -c "CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD_GENERATED}';"
else
  log "Role ${DB_USER} já existe, pulando (senha não é alterada)"
fi

if ! $SUDO -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  log "Criando database ${DB_NAME}"
  $SUDO -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
else
  log "Database ${DB_NAME} já existe, pulando"
fi

# ===== 6. Firewall =====
log "Configurando ufw (libera só SSH, 80 e 443 — Postgres nunca é exposto)"
$SUDO ufw allow OpenSSH
$SUDO ufw allow 80/tcp
$SUDO ufw allow 443/tcp
$SUDO ufw --force enable

# ===== 7. Nginx + certbot =====
if ! command -v nginx &>/dev/null; then
  log "Instalando Nginx"
  $SUDO apt-get install -y nginx
else
  log "Nginx já instalado, pulando"
fi

if ! command -v certbot &>/dev/null; then
  log "Instalando certbot"
  $SUDO apt-get install -y certbot python3-certbot-nginx
else
  log "certbot já instalado, pulando"
fi

# ===== 8. Clonar/atualizar o repo =====
if [ ! -d "$APP_DIR/.git" ]; then
  log "Clonando $REPO_URL em $APP_DIR"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
else
  log "$APP_DIR já é um clone do repo, pulando"
fi

# ===== 9. .env.production =====
ENV_FILE="$APP_DIR/.env.production"
if [ ! -f "$ENV_FILE" ]; then
  log "Criando $ENV_FILE a partir do template"
  cp "$APP_DIR/.env.production.example" "$ENV_FILE"

  DB_PASSWORD_FOR_ENV="${DB_PASSWORD_GENERATED:-CHANGE_ME_role_ja_existia_confira_a_senha}"
  BETTER_AUTH_SECRET_GENERATED="$(openssl rand -base64 32)"

  sed -i "s#^DATABASE_URL=.*#DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD_FOR_ENV}@host.docker.internal:5432/${DB_NAME}#" "$ENV_FILE"
  sed -i "s#^BETTER_AUTH_SECRET=.*#BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET_GENERATED}#" "$ENV_FILE"
  sed -i "s#^BETTER_AUTH_URL=.*#BETTER_AUTH_URL=https://${DOMAIN}#" "$ENV_FILE"
  sed -i "s#^NEXT_PUBLIC_APP_URL=.*#NEXT_PUBLIC_APP_URL=https://${DOMAIN}#" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
else
  log "$ENV_FILE já existe, não sobrescrevendo"
fi

# ===== 10. Nginx: server block do subdomínio =====
log "Configurando Nginx para ${DOMAIN}"
$SUDO cp "$APP_DIR/deploy/nginx/${DOMAIN}.conf" "/etc/nginx/sites-available/${DOMAIN}.conf"
$SUDO ln -sf "/etc/nginx/sites-available/${DOMAIN}.conf" "/etc/nginx/sites-enabled/${DOMAIN}.conf"
$SUDO nginx -t
$SUDO systemctl reload nginx

# ===== 11. SSL via certbot =====
if [ -n "$LETSENCRYPT_EMAIL" ]; then
  log "Emitindo certificado SSL para ${DOMAIN}"
  $SUDO certbot --nginx -d "$DOMAIN" -m "$LETSENCRYPT_EMAIL" --agree-tos --non-interactive --redirect
else
  log "LETSENCRYPT_EMAIL não definido — pulei o certbot."
  echo "Rode manualmente depois de apontar o DNS: sudo certbot --nginx -d ${DOMAIN}"
fi

# ===== Resumo =====
log "Setup concluído"
echo "App dir:        $APP_DIR"
echo "Env file:        $ENV_FILE"
if [ -n "$DB_PASSWORD_GENERATED" ]; then
  echo "Senha do DB gerada agora (também já está no .env.production): $DB_PASSWORD_GENERATED"
fi
echo
echo "Falta antes do primeiro deploy:"
echo "  1. Confirmar DNS: ${DOMAIN} -> IP desta VPS"
echo "  2. Preencher GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET em $ENV_FILE"
echo "     (redirect URI no Google Console: https://${DOMAIN}/api/auth/callback/google)"
echo "  3. Preencher ADMIN_EMAIL(_2) / ADMIN_PASSWORD(_2) em $ENV_FILE"
if [ "${NEEDS_RELOGIN:-0}" = "1" ]; then
  echo "  4. Sair e logar de novo (ou 'newgrp docker') para o grupo docker valer nesta sessão"
fi
echo
echo "Depois disso: cd $APP_DIR && ./scripts/deploy.sh"
