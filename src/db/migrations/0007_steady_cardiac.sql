DROP INDEX "completion_task_user_unique";--> statement-breakpoint
ALTER TABLE "completion" ADD COLUMN "day" date;--> statement-breakpoint
CREATE UNIQUE INDEX "completion_task_user_day_unique" ON "completion" USING btree ("task_id","user_id","day") WHERE "completion"."day" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "completion_task_user_unique" ON "completion" USING btree ("task_id","user_id") WHERE "completion"."day" IS NULL;