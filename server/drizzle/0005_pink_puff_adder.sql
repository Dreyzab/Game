ALTER TABLE "resonance_checks_log" ALTER COLUMN "created_at" SET DEFAULT 1767124670358;--> statement-breakpoint
ALTER TABLE "resonance_interrupts" ALTER COLUMN "created_at" SET DEFAULT 1767124670357;--> statement-breakpoint
ALTER TABLE "resonance_item_uses" ALTER COLUMN "created_at" SET DEFAULT 1767124670358;--> statement-breakpoint
ALTER TABLE "resonance_items" ALTER COLUMN "created_at" SET DEFAULT 1767124670358;--> statement-breakpoint
ALTER TABLE "resonance_kudos" ALTER COLUMN "created_at" SET DEFAULT 1767124670358;--> statement-breakpoint
ALTER TABLE "resonance_player_items" ALTER COLUMN "created_at" SET DEFAULT 1767124670358;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "joined_at" SET DEFAULT 1767124670357;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "updated_at" SET DEFAULT 1767124670357;--> statement-breakpoint
ALTER TABLE "resonance_proxemic_log" ALTER COLUMN "created_at" SET DEFAULT 1767124670358;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "created_at" SET DEFAULT 1767124670357;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "updated_at" SET DEFAULT 1767124670357;--> statement-breakpoint
ALTER TABLE "resonance_strain_log" ALTER COLUMN "created_at" SET DEFAULT 1767124670357;--> statement-breakpoint
ALTER TABLE "resonance_votes" ALTER COLUMN "created_at" SET DEFAULT 1767124670357;--> statement-breakpoint
ALTER TABLE "coop_sessions" ADD COLUMN "flags" json DEFAULT '{}'::json;