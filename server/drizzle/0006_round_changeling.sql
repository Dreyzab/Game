CREATE TABLE "world_rifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_key" text,
	"spawn_point_idx" integer,
	"state" text DEFAULT 'unstable',
	"intensity" integer DEFAULT 1,
	"last_tick_at" bigint,
	"stabilized_until" bigint,
	"created_at" bigint,
	"updated_at" bigint
);
--> statement-breakpoint
CREATE TABLE "survival_sessions" (
	"session_id" text PRIMARY KEY NOT NULL,
	"state" jsonb NOT NULL,
	"status" text DEFAULT 'lobby' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"last_real_tick_at" bigint,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "resonance_checks_log" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_interrupts" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_item_uses" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_items" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_kudos" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_player_items" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "joined_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "updated_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_proxemic_log" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "updated_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_strain_log" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "resonance_votes" ALTER COLUMN "created_at" SET DEFAULT 1768562690922;--> statement-breakpoint
ALTER TABLE "danger_zones" ADD COLUMN "key" text;--> statement-breakpoint
ALTER TABLE "danger_zones" ADD COLUMN "spawn_points" jsonb;--> statement-breakpoint
ALTER TABLE "world_rifts" ADD CONSTRAINT "world_rifts_zone_key_danger_zones_key_fk" FOREIGN KEY ("zone_key") REFERENCES "public"."danger_zones"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survival_sessions_status_idx" ON "survival_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "survival_sessions_expires_at_idx" ON "survival_sessions" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "danger_zones" ADD CONSTRAINT "danger_zones_key_unique" UNIQUE("key");