This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

A aplicação roda em produção numa VPS própria (Docker + Nginx + Postgres nativo),
em `gameficacao.brunogusmao.dev`. Não há deploy na Vercel.

**Setup inicial da VPS (uma única vez, numa VPS Ubuntu/Debian limpa):**

```bash
LETSENCRYPT_EMAIL=seu@email.com ./scripts/vps-setup.sh
```

Instala Docker, PostgreSQL nativo, Nginx e certbot; cria o banco/role de produção;
configura o subdomínio com SSL; clona o repo e gera `.env.production` a partir de
`.env.production.example`. Ao final, preencha manualmente as credenciais do Google
OAuth e do admin inicial em `.env.production`.

**A cada novo deploy:**

```bash
cd ~/apps/evento-gamificacao && ./scripts/deploy.sh
```

Puxa `main`, builda a imagem Docker, roda as migrations do Drizzle contra o Postgres
do host, sobe o container e valida com um healthcheck. Veja
[`scripts/deploy.sh`](scripts/deploy.sh) e [`scripts/vps-setup.sh`](scripts/vps-setup.sh)
para os detalhes de cada etapa.
