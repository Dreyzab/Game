ALTER TABLE "game_progress" ADD COLUMN IF NOT EXISTS "game_mode" text DEFAULT 'survival' NOT NULL;--> statement-breakpoint
