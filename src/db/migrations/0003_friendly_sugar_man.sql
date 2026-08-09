DROP INDEX "winner_rank_unique";--> statement-breakpoint
CREATE INDEX "winner_rank_idx" ON "winner" USING btree ("rank");