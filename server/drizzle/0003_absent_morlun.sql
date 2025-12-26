CREATE TABLE "coop_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"role" text,
	"is_ready" boolean DEFAULT false,
	"joined_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coop_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" integer NOT NULL,
	"invite_code" text NOT NULL,
	"status" text DEFAULT 'waiting',
	"current_scene" text DEFAULT 'prologue_start',
	"max_players" integer DEFAULT 4,
	"created_at" bigint NOT NULL,
	"started_at" bigint,
	"ended_at" bigint,
	CONSTRAINT "coop_sessions_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "coop_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"scene_id" text NOT NULL,
	"choice_id" text NOT NULL,
	"voter_id" integer NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resonance_checks_log" ALTER COLUMN "created_at" SET DEFAULT 1766753432821;--> statement-breakpoint
ALTER TABLE "resonance_interrupts" ALTER COLUMN "created_at" SET DEFAULT 1766753432820;--> statement-breakpoint
ALTER TABLE "resonance_item_uses" ALTER COLUMN "created_at" SET DEFAULT 1766753432821;--> statement-breakpoint
ALTER TABLE "resonance_items" ALTER COLUMN "created_at" SET DEFAULT 1766753432821;--> statement-breakpoint
ALTER TABLE "resonance_kudos" ALTER COLUMN "created_at" SET DEFAULT 1766753432820;--> statement-breakpoint
ALTER TABLE "resonance_player_items" ALTER COLUMN "created_at" SET DEFAULT 1766753432821;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "joined_at" SET DEFAULT 1766753432820;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "updated_at" SET DEFAULT 1766753432820;--> statement-breakpoint
ALTER TABLE "resonance_proxemic_log" ALTER COLUMN "created_at" SET DEFAULT 1766753432820;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "created_at" SET DEFAULT 1766753432820;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "updated_at" SET DEFAULT 1766753432820;--> statement-breakpoint
ALTER TABLE "resonance_strain_log" ALTER COLUMN "created_at" SET DEFAULT 1766753432820;--> statement-breakpoint
ALTER TABLE "resonance_votes" ALTER COLUMN "created_at" SET DEFAULT 1766753432820;--> statement-breakpoint
ALTER TABLE "coop_participants" ADD CONSTRAINT "coop_participants_session_id_coop_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."coop_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coop_participants" ADD CONSTRAINT "coop_participants_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coop_sessions" ADD CONSTRAINT "coop_sessions_host_id_players_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coop_votes" ADD CONSTRAINT "coop_votes_session_id_coop_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."coop_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coop_votes" ADD CONSTRAINT "coop_votes_voter_id_players_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "part_session_idx" ON "coop_participants" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "part_player_idx" ON "coop_participants" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "coop_host_idx" ON "coop_sessions" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "coop_code_idx" ON "coop_sessions" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "vote_session_scene_idx" ON "coop_votes" USING btree ("session_id","scene_id");
