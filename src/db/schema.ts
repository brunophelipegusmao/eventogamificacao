import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
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
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("completion_task_user_unique").on(t.taskId, t.userId),
    index("completion_user_idx").on(t.userId),
    index("completion_status_idx").on(t.status),
  ],
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
