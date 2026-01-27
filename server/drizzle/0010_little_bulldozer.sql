CREATE TABLE "detective_hardlinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"pack_id" varchar(64) NOT NULL,
	"hardlink_id" varchar(255) NOT NULL,
	"is_repeatable" boolean DEFAULT false NOT NULL,
	"actions" jsonb NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detective_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"device_id" varchar(255),
	"pack_id" varchar(64) NOT NULL,
	"hardlink_id" varchar(255) NOT NULL,
	"scanned_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resonance_checks_log" ALTER COLUMN "created_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_interrupts" ALTER COLUMN "created_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_item_uses" ALTER COLUMN "created_at" SET DEFAULT 1769371114406;--> statement-breakpoint
ALTER TABLE "resonance_items" ALTER COLUMN "created_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_kudos" ALTER COLUMN "created_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_player_items" ALTER COLUMN "created_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "joined_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "updated_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_proxemic_log" ALTER COLUMN "created_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "created_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "updated_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_strain_log" ALTER COLUMN "created_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "resonance_votes" ALTER COLUMN "created_at" SET DEFAULT 1769371114405;--> statement-breakpoint
ALTER TABLE "game_progress" ADD COLUMN IF NOT EXISTS "game_mode" text DEFAULT 'survival' NOT NULL;--> statement-breakpoint
ALTER TABLE "game_progress" ADD COLUMN IF NOT EXISTS "detective_state" jsonb DEFAULT '{"entries":[],"evidence":[],"pointStates":{},"flags":{},"detectiveName":null,"lastSyncedAt":0}'::jsonb;--> statement-breakpoint
CREATE INDEX "idx_pack_hardlink" ON "detective_hardlinks" USING btree ("pack_id","hardlink_id");--> statement-breakpoint
CREATE INDEX "idx_user_pack_hardlink" ON "detective_scans" USING btree ("user_id","pack_id","hardlink_id");--> statement-breakpoint
CREATE INDEX "idx_device_pack_hardlink" ON "detective_scans" USING btree ("device_id","pack_id","hardlink_id");
