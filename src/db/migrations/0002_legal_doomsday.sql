CREATE TYPE "public"."event_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "event" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "event_status" DEFAULT 'open' NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "winner" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"rank" integer NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"prize_id" text,
	"prize_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "winner" ADD CONSTRAINT "winner_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner" ADD CONSTRAINT "winner_prize_id_prize_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."prize"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "winner_rank_unique" ON "winner" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "winner_user_idx" ON "winner" USING btree ("user_id");