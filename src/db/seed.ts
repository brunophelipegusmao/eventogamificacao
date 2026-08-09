import "dotenv/config";
import { db } from "./index";
import { authAccount, authUser, task, prize, event } from "./schema";
import { hashPassword } from "@better-auth/utils/password";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { EVENT_ID } from "../lib/event";

async function upsertUser(input: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "participant";
}) {
  const [existing] = await db
    .select()
    .from(authUser)
    .where(eq(authUser.email, input.email))
    .limit(1);

  if (existing) {
    console.log(`usuário já existe: ${input.email}`);
    return existing;
  }

  const passwordHash = await hashPassword(input.password);
  const userId = randomUUID();
  const [user] = await db
    .insert(authUser)
    .values({
      id: userId,
      name: input.name,
      email: input.email,
      emailVerified: true,
      role: input.role,
      totalPoints: 0,
    })
    .returning();

  // Registro na tabela account (provider "credential") para o
  // better-auth conseguir autenticar por e-mail/senha.
  await db.insert(authAccount).values({
    id: randomUUID(),
    userId,
    providerId: "credential",
    accountId: userId,
    password: passwordHash,
  });

  console.log(`criado ${input.role}: ${input.email}`);
  return user;
}

async function main() {
  console.log("=== SEED: admins ===");
  const admin1 = await upsertUser({
    email: process.env.ADMIN_EMAIL ?? "admin@julianamartinsfitness.store",
    password: process.env.ADMIN_PASSWORD ?? "Admin@123456",
    name: "Juliana Martins",
    role: "admin",
  });
  const admin2 = await upsertUser({
    email: process.env.ADMIN_EMAIL_2 ?? "admin2@julianamartinsfitness.store",
    password: process.env.ADMIN_PASSWORD_2 ?? "Admin2@123456",
    name: "Admin Evento",
    role: "admin",
  });
  console.log("admins:", admin1.email, "|", admin2.email);

  console.log("=== SEED: tarefas iniciais ===");
  const [existingTask] = await db
    .select({ id: task.id })
    .from(task)
    .limit(1);
  if (!existingTask) {
    await db.insert(task).values([
      {
        id: randomUUID(),
        title: "Check-in do evento",
        description:
          "Toque no botão para registrar sua presença no evento. Pontuação automática!",
        type: "checkin",
        confirmation: "automatic",
        points: 50,
        status: "active",
        config: { checkin: true },
        sortOrder: 1,
      },
      {
        id: randomUUID(),
        title: "Formulário completo",
        description:
          "Preencha seu perfil completo (nome, e-mail, WhatsApp e Instagram) para garantir todos os pontos das próximas tarefas.",
        type: "form",
        confirmation: "automatic",
        points: 30,
        status: "active",
        config: {
          fields: [
            {
              key: "objetivo",
              label: "Qual seu principal objetivo?",
              type: "text",
              required: true,
            },
            {
              key: "frequencia",
              label: "Quantas vezes treina por semana?",
              type: "text",
              required: true,
            },
            {
              key: "aceite",
              label: "Aceito receber novidades da JM Fitness",
              type: "checkbox",
              required: false,
            },
          ],
        },
        sortOrder: 2,
      },
      {
        id: randomUUID(),
        title: "QR Code do estande",
        description:
          "Escaneie o QR Code no estande de suplementos para ganhar pontos. Vale um único uso por participante.",
        type: "qr_code",
        confirmation: "qr_code",
        points: 40,
        status: "active",
        config: { qr: "GAMIF-SUPLEMENTOS-2026" },
        sortOrder: 3,
      },
      {
        id: randomUUID(),
        title: "Post nos stories",
        description:
          "Poste um story marcando @julianamartinsfitnessstore e envie o print. A confirmação é feita por um admin.",
        type: "social",
        confirmation: "admin",
        points: 60,
        status: "active",
        config: {},
        sortOrder: 4,
      },
    ]);
    console.log("tarefas criadas: 4");
  } else {
    console.log("tarefas já existem");
  }

  console.log("=== SEED: prêmios ===");
  const [existingPrize] = await db.select({ id: prize.id }).from(prize).limit(1);
  if (!existingPrize) {
    await db.insert(prize).values([
      {
        id: randomUUID(),
        name: "Kit Suplementos Premium",
        description: "1º lugar: whey + creatina + pré-treino (30 dias)",
        placement: 1,
        active: true,
      },
      {
        id: randomUUID(),
        name: "Camiseta + Shaker exclusivo",
        description: "2º ao 3º lugar",
        placement: 3,
        active: true,
      },
      {
        id: randomUUID(),
        name: "Brinde JM Fitness",
        description: "4º ao 10º lugar",
        placement: 10,
        active: true,
      },
    ]);
    console.log("prêmios criados: 3");
  } else {
    console.log("prêmios já existem");
  }

  console.log("=== SEED: evento ===");
  const [existingEvent] = await db
    .select({ id: event.id })
    .from(event)
    .where(eq(event.id, EVENT_ID))
    .limit(1);
  if (!existingEvent) {
    await db.insert(event).values({ id: EVENT_ID, status: "open" });
    console.log("evento criado (aberto)");
  } else {
    console.log("evento já existe");
  }

  console.log("=== SEED FINALIZADO ===");
  process.exit(0);
}

main().catch((e) => {
  console.error("Erro no seed:", e);
  process.exit(1);
});
