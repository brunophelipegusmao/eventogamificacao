import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ============================================================
 * ENUMS
 * ============================================================ */

export const userRoleEnum = pgEnum("user_role", ["admin", "participant"]);

export const taskTypeEnum = pgEnum("task_type", [
  "checkin",
  "form",
  "qr_code",
  "social",
]);

export const taskConfirmationEnum = pgEnum("task_confirmation", [
  "automatic",
  "qr_code",
  "admin",
]);

export const taskStatusEnum = pgEnum("task_status", ["active", "inactive"]);

export const completionStatusEnum = pgEnum("completion_status", [
  "pending",
  "approved",
  "rejected",
]);

/* ============================================================
 * USUÁRIOS (tabela do Better-Auth + campos adicionais)
 * ============================================================ */

export const authUser = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // --- campos adicionais (additionalFields do better-auth) ---
    role: userRoleEnum("role").notNull().default("participant"),
    phone: text("phone"),
    instagram: text("instagram"),
    instagramWarningSeen: boolean("instagram_warning_seen")
      .notNull()
      .default(false),
    totalPoints: integer("total_points").notNull().default(0),
  },
  (t) => [
    uniqueIndex("user_email_unique").on(t.email),
    index("user_points_idx").on(t.totalPoints),
  ],
);

export const authSession = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => authUser.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authAccount = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    accountId: text("account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const authVerification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Tabela do plugin JWT do better-auth (chaves JWKS) */
export const authJwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ============================================================
 * TAREFAS
 * ============================================================ */

export const task = pgTable(
  "task",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    type: taskTypeEnum("type").notNull(),
    confirmation: taskConfirmationEnum("confirmation").notNull(),
    points: integer("points").notNull().default(10),
    status: taskStatusEnum("status").notNull().default("active"),
    /**
     * Dados específicos por tipo de confirmação:
     * - qr_code:   { "qr": "segredo-do-qr" } (hash a ser validado)
     * - form:      { "fields": [{ "key": "resposta", "label": "Pergunta", "type": "text" | "checkbox", "required": true }] }
     * - automatic: { "checkin": true } (botão simples)
     */
    config: jsonb("config"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("task_status_idx").on(t.status)],
);

/* ============================================================
 * REALIZAÇÕES (completions) de tarefas
 * ============================================================ */

export const completion = pgTable(
  "completion",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    status: completionStatusEnum("status").notNull().default("pending"),
    /** Dados enviados pelo participante (ex.: respostas do formulário) */
    payload: jsonb("payload"),
    /** Nota/campo do admin ao aprovar ou rejeitar */
    adminNote: text("admin_note"),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    /** Dia (AAAA-MM-DD) do check-in, apenas para tarefas do tipo "checkin" — permite uma conclusão por dia. Nulo para tarefas de conclusão única. */
    day: date("day"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("completion_task_user_unique")
      .on(t.taskId, t.userId)
      .where(sql`${t.day} IS NULL`),
    uniqueIndex("completion_task_user_day_unique")
      .on(t.taskId, t.userId, t.day)
      .where(sql`${t.day} IS NOT NULL`),
    index("completion_user_idx").on(t.userId),
    index("completion_status_idx").on(t.status),
  ],
);

/* ============================================================
 * AJUSTES MANUAIS DE PONTOS (correções feitas por admins)
 * ============================================================ */

export const pointAdjustment = pgTable(
  "point_adjustment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    adminId: text("admin_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    /** Delta aplicado a totalPoints; positivo ou negativo, nunca zero */
    points: integer("points").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("point_adjustment_user_idx").on(t.userId)],
);

/* ============================================================
 * PRÊMIOS
 * ============================================================ */

export const prize = pgTable(
  "prize",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    /** Até qual colocação o prêmio cobre (ex.: 1, 3, 10) */
    placement: integer("placement").notNull().default(1),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("prize_active_idx").on(t.active)],
);

/* ============================================================
 * EVENTO (status global)
 * ============================================================ */

export const eventStatusEnum = pgEnum("event_status", ["open", "closed"]);

export const event = pgTable("event", {
  id: text("id").primaryKey(),
  status: eventStatusEnum("status").notNull().default("open"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ============================================================
 * CONFIGURAÇÕES DO SITE (linha singleton)
 * ============================================================ */

export type SponsorProduct = {
  name: string;
  description: string;
  tag: string;
  imageUrl: string;
  link: string;
};

export type PromoMedia = {
  type: "image" | "video";
  url: string;
};

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey(),
  /** URLs das logos de realização/apoio exibidas na home (1 a 6 imagens) */
  sponsorLogos: jsonb("sponsor_logos")
    .$type<string[]>()
    .notNull()
    .default(["/logos/jm_512x512.webp"]),
  /** Produtos exibidos em "Conheça a linha" (1 a 6 produtos) */
  products: jsonb("products")
    .$type<SponsorProduct[]>()
    .notNull()
    .default([
      {
        name: "Whey Protein",
        description: "Recuperação muscular pós-treino",
        tag: "Proteína",
        imageUrl: "",
        link: "",
      },
      {
        name: "Creatina",
        description: "Força e performance nos treinos",
        tag: "Força",
        imageUrl: "",
        link: "",
      },
      {
        name: "Pré-Treino",
        description: "Energia para treinar mais pesado",
        tag: "Energia",
        imageUrl: "",
        link: "",
      },
      {
        name: "BCAA",
        description: "Suporte durante o treino",
        tag: "Recuperação",
        imageUrl: "",
        link: "",
      },
    ]),
  /** Imagem ou vídeo de destaque exibido na home (formato 16:9) */
  promoMedia: jsonb("promo_media")
    .$type<PromoMedia>()
    .notNull()
    .default({ type: "image", url: "/images/promo-event.jpeg" }),
  /** Ícone salvo na tela inicial ao instalar o PWA (ideal 512x512, quadrado) */
  pwaIconUrl: text("pwa_icon_url").notNull().default("/logos/jm_512x512.webp"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ============================================================
 * VENCEDORES (snapshot final do ranking)
 * ============================================================ */

export const winner = pgTable(
  "winner",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    totalPoints: integer("total_points").notNull().default(0),
    prizeId: text("prize_id").references(() => prize.id, {
      onDelete: "set null",
    }),
    prizeName: text("prize_name"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("winner_rank_idx").on(t.rank),
    index("winner_user_idx").on(t.userId),
  ],
);

/* ============================================================
 * INSCRIÇÕES DE NOTIFICAÇÃO PUSH (por dispositivo/navegador)
 * ============================================================ */

export const pushSubscription = pgTable(
  "push_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("push_subscription_endpoint_unique").on(t.endpoint),
    index("push_subscription_user_idx").on(t.userId),
  ],
);
