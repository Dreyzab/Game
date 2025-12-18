CREATE TABLE "behavior_trees" (
	"id" text PRIMARY KEY NOT NULL,
	"tree" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resonance_checks_log" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_interrupts" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_item_uses" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_items" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_kudos" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_player_items" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "joined_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_players" ALTER COLUMN "updated_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_proxemic_log" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_sessions" ALTER COLUMN "updated_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_strain_log" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "resonance_votes" ALTER COLUMN "created_at" SET DEFAULT 1766014262399;--> statement-breakpoint
ALTER TABLE "npc_instances" ALTER COLUMN "combat_session_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "npc_templates" ALTER COLUMN "ai_behavior_tree_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "npc_templates" ADD CONSTRAINT "npc_templates_ai_behavior_tree_id_behavior_trees_id_fk" FOREIGN KEY ("ai_behavior_tree_id") REFERENCES "public"."behavior_trees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
UPDATE "scene_logs"
SET "payload" = jsonb_set(coalesce("payload", '{}'::jsonb), '{type}', '"scene_commit"', true)
WHERE ("payload" ->> 'type') IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "scene_logs_scene_commit_unq" ON "scene_logs" USING btree ("player_id","scene_id") WHERE ("scene_logs"."payload" ->> 'type') = 'scene_commit';
