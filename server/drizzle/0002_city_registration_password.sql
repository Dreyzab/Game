ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "password_hash" text;
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "password_salt" text;
