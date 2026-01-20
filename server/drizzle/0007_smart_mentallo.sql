CREATE TABLE "vn_commits" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"commit_nonce" text NOT NULL,
	"result" jsonb,
	"created_at" bigint NOT NULL,
	CONSTRAINT "vn_commits_commit_nonce_unique" UNIQUE("commit_nonce")
);
--> statement-breakpoint
CREATE TABLE "vn_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"scene_id" text NOT NULL,
	"seed" bigint NOT NULL,
	"state_version" integer NOT NULL,
	"snapshot_hash" text NOT NULL,
	"allowed_ops" jsonb,
	"initial_state" jsonb,
	"expires_at" bigint NOT NULL,
	"committed_at" bigint,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resonance_checks_log" ALTER COLUMN "created_at" SET DEFAULT 1768843235059;--> statement-breakpoint
ALTER TABLE "resonance_interrupts" ALTER COLUMN "created_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "resonance_item_uses" ALTER COLUMN "created_at" SET DEFAULT 1768843235059;--> statement-breakpoint
ALTER TABLE "resonance_items" ALTER COLUMN "created_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "resonance_kudos" ALTER COLUMN "created_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "resonance_player_items" ALTER COLUMN "created_at" SET DEFAULT 1768843235059;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "joined_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "updated_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "resonance_proxemic_log" ALTER COLUMN "created_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "created_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "updated_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "resonance_strain_log" ALTER COLUMN "created_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "resonance_votes" ALTER COLUMN "created_at" SET DEFAULT 1768843235058;--> statement-breakpoint
ALTER TABLE "game_progress" ADD COLUMN "state_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "quest_progress" ADD COLUMN "abandoned_at" bigint;--> statement-breakpoint
ALTER TABLE "quest_progress" ADD COLUMN "failed_at" bigint;--> statement-breakpoint
ALTER TABLE "vn_commits" ADD CONSTRAINT "vn_commits_session_id_vn_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."vn_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vn_sessions" ADD CONSTRAINT "vn_sessions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vn_commits_session_idx" ON "vn_commits" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "vn_sessions_player_idx" ON "vn_sessions" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "vn_sessions_expires_idx" ON "vn_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "qp_player_quest_unq" ON "quest_progress" USING btree ("player_id","quest_id");