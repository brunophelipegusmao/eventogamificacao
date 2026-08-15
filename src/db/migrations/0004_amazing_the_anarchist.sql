CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"sponsor_logos" jsonb DEFAULT '["/logos/jm_512x512.webp"]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
