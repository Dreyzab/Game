CREATE TABLE "game_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"current_scene" text DEFAULT 'prologue_coupe_start',
	"visited_scenes" jsonb DEFAULT '[]'::jsonb,
	"flags" jsonb DEFAULT '{}'::jsonb,
	"level" integer DEFAULT 1,
	"xp" integer DEFAULT 0,
	"skill_points" integer DEFAULT 0,
	"skills" jsonb DEFAULT '{}'::jsonb,
	"subclasses" jsonb DEFAULT '[]'::jsonb,
	"gold" integer DEFAULT 0,
	"reputation" jsonb DEFAULT '{}'::jsonb,
	"hp" integer,
	"max_hp" integer,
	"morale" integer,
	"max_morale" integer,
	"stamina" integer,
	"max_stamina" integer,
	"phase" integer DEFAULT 1,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"device_id" text,
	"name" text NOT NULL,
	"fame" integer DEFAULT 0,
	"faction_id" text,
	"squad_id" text,
	"location" jsonb,
	"last_seen" bigint,
	"status" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "players_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "players_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" integer,
	"template_id" text NOT NULL,
	"instance_id" text,
	"name" text,
	"description" text,
	"kind" text,
	"rarity" text,
	"stats" jsonb,
	"container_id" uuid,
	"slot" text,
	"grid_position" jsonb,
	"quantity" integer DEFAULT 1,
	"condition" integer DEFAULT 100,
	"created_at" bigint,
	CONSTRAINT "items_instance_id_unique" UNIQUE("instance_id")
);
--> statement-breakpoint
CREATE TABLE "trade_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"owner_role" text NOT NULL,
	"item_id" uuid,
	"template_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'player_inventory',
	"locked" boolean DEFAULT false,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiator_id" integer NOT NULL,
	"partner_id" integer,
	"partner_npc_id" text,
	"currency" text DEFAULT 'кр.',
	"status" text DEFAULT 'draft',
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"expires_at" bigint
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"item_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" bigint NOT NULL,
	"completed_at" bigint
);
--> statement-breakpoint
CREATE TABLE "danger_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"danger_level" text DEFAULT 'low',
	"polygon" jsonb NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "map_points" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"type" text,
	"qr_code" text,
	"phase" integer,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "point_discoveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"device_id" text,
	"point_key" text NOT NULL,
	"discovered_at" bigint,
	"researched_at" bigint,
	"updated_at" bigint
);
--> statement-breakpoint
CREATE TABLE "quest_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"player_id" integer NOT NULL,
	"quest_id" text NOT NULL,
	"current_step" text,
	"status" text,
	"started_at" bigint,
	"completed_at" bigint,
	"progress" jsonb
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"phase" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"prerequisites" jsonb,
	"rewards" jsonb,
	"steps" jsonb,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE "safe_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"faction" text,
	"polygon" jsonb NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"center" jsonb NOT NULL,
	"radius" integer NOT NULL,
	"owner_faction_id" text,
	"status" text DEFAULT 'peace',
	"health" integer DEFAULT 100,
	"last_captured_at" bigint
);
--> statement-breakpoint
CREATE TABLE "battle_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"battle_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"rank" integer NOT NULL,
	"class_id" text,
	"hp" integer DEFAULT 100,
	"max_hp" integer DEFAULT 100,
	"energy" integer DEFAULT 10,
	"max_energy" integer DEFAULT 10,
	"hand" jsonb,
	"deck" jsonb,
	"discard" jsonb,
	"effects" jsonb,
	"joined_at" bigint
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" integer,
	"status" text DEFAULT 'waiting',
	"phase" text DEFAULT 'player_turn',
	"is_active" boolean DEFAULT true,
	"winner_id" text,
	"current_turn_actor_id" text,
	"turn_order" jsonb,
	"current_actor_index" integer DEFAULT 0,
	"round" integer DEFAULT 1,
	"enemies" jsonb,
	"logs" jsonb DEFAULT '[]'::jsonb,
	"created_at" bigint,
	"updated_at" bigint
);
--> statement-breakpoint
CREATE TABLE "scene_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"user_id" text,
	"device_id" text,
	"scene_id" text NOT NULL,
	"choices" jsonb,
	"payload" jsonb,
	"started_at" bigint,
	"finished_at" bigint,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE "weapon_mastery" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"weapon_type" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"xp_to_next_level" integer DEFAULT 100 NOT NULL,
	"unlocked_cards" jsonb DEFAULT '[]'::jsonb,
	"total_xp_earned" integer DEFAULT 0 NOT NULL,
	"total_kills" integer DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "weapon_mastery_player_id_weapon_type_unique" UNIQUE("player_id","weapon_type")
);
--> statement-breakpoint
CREATE TABLE "resonance_checks_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"scene_key" text NOT NULL,
	"player_id" integer,
	"skill" text NOT NULL,
	"dc" integer NOT NULL,
	"result" text NOT NULL,
	"roll" integer,
	"position" integer,
	"strain_delta" integer,
	"trust_delta" integer,
	"created_at" bigint DEFAULT 1765570286545
);
--> statement-breakpoint
CREATE TABLE "resonance_injections" (
	"id" serial PRIMARY KEY NOT NULL,
	"scene_key" text NOT NULL,
	"archetype" text NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resonance_interrupts" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"scene_key" text NOT NULL,
	"player_id" integer,
	"type" text NOT NULL,
	"cost" integer DEFAULT 0,
	"payload" jsonb,
	"created_at" bigint DEFAULT 1765570286545
);
--> statement-breakpoint
CREATE TABLE "resonance_item_uses" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"player_id" integer,
	"item_id" text,
	"effect" jsonb,
	"created_at" bigint DEFAULT 1765570286545
);
--> statement-breakpoint
CREATE TABLE "resonance_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slot" text NOT NULL,
	"charges" integer,
	"cooldown_scenes" integer,
	"data" jsonb,
	"created_at" bigint DEFAULT 1765570286545
);
--> statement-breakpoint
CREATE TABLE "resonance_kudos" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"from_player" integer,
	"to_player" integer,
	"tag" text NOT NULL,
	"created_at" bigint DEFAULT 1765570286545
);
--> statement-breakpoint
CREATE TABLE "resonance_player_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"item_id" text NOT NULL,
	"state" jsonb,
	"created_at" bigint DEFAULT 1765570286545
);
--> statement-breakpoint
CREATE TABLE "resonance_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"user_id" text,
	"device_id" text,
	"name" text NOT NULL,
	"archetype" text,
	"rank" integer DEFAULT 3,
	"conviction" integer DEFAULT 3,
	"is_host" boolean DEFAULT false,
	"statuses" jsonb DEFAULT '[]'::jsonb,
	"joined_at" bigint DEFAULT 1765570286544,
	"updated_at" bigint DEFAULT 1765570286544
);
--> statement-breakpoint
CREATE TABLE "resonance_proxemic_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"player_id" integer,
	"proximity_hint" text,
	"created_at" bigint DEFAULT 1765570286545
);
--> statement-breakpoint
CREATE TABLE "resonance_scenes" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_id" text NOT NULL,
	"scene_key" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb
);
--> statement-breakpoint
CREATE TABLE "resonance_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"episode_id" text NOT NULL,
	"scene_id" text NOT NULL,
	"status" text DEFAULT 'lobby',
	"strain" integer DEFAULT 0,
	"trust" integer DEFAULT 0,
	"brake" boolean DEFAULT false,
	"alert" integer DEFAULT 0,
	"created_at" bigint DEFAULT 1765570286544,
	"updated_at" bigint DEFAULT 1765570286544,
	CONSTRAINT "resonance_sessions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "resonance_strain_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" bigint DEFAULT 1765570286545
);
--> statement-breakpoint
CREATE TABLE "resonance_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"scene_key" text NOT NULL,
	"player_id" integer NOT NULL,
	"option_id" text NOT NULL,
	"weight" integer DEFAULT 1,
	"created_at" bigint DEFAULT 1765570286544
);
--> statement-breakpoint
CREATE TABLE "npc_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"combat_session_id" uuid,
	"current_hp" integer NOT NULL,
	"current_stamina" integer NOT NULL,
	"current_morale" integer NOT NULL,
	"current_rank" integer NOT NULL,
	"side" text DEFAULT 'ENEMY',
	"is_rooted" boolean DEFAULT false,
	"is_stunned" boolean DEFAULT false,
	"status_effects" jsonb DEFAULT '[]'::jsonb,
	"weapon_condition" integer DEFAULT 100,
	"weapon_heat" integer DEFAULT 0,
	"ammo_count" integer DEFAULT 10
);
--> statement-breakpoint
CREATE TABLE "npc_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"faction" text NOT NULL,
	"archetype" text NOT NULL,
	"base_force" integer DEFAULT 5,
	"base_endurance" integer DEFAULT 5,
	"base_reflex" integer DEFAULT 5,
	"base_logic" integer DEFAULT 5,
	"base_psyche" integer DEFAULT 5,
	"base_authority" integer DEFAULT 5,
	"max_hp" integer NOT NULL,
	"max_stamina" integer NOT NULL,
	"max_morale" integer NOT NULL,
	"ai_behavior_tree_id" text NOT NULL,
	"aggro_logic" text DEFAULT 'CLOSEST',
	"size" integer DEFAULT 1,
	"preferred_rank" integer NOT NULL,
	"loot_table_id" uuid,
	"default_weapon_id" uuid
);
--> statement-breakpoint
CREATE TABLE "card_synthesis_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voice_name" text NOT NULL,
	"weapon_type" text NOT NULL,
	"damage_multiplier" integer DEFAULT 100,
	"added_effect" text,
	"added_tag" text,
	"ap_cost_modifier" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "voice_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" integer NOT NULL,
	"voice_might" integer DEFAULT 0,
	"voice_pain_threshold" integer DEFAULT 0,
	"voice_endurance" integer DEFAULT 0,
	"voice_physical_instrument" integer DEFAULT 0,
	"voice_electrochemistry" integer DEFAULT 0,
	"voice_shivers" integer DEFAULT 0,
	"voice_coordination" integer DEFAULT 0,
	"voice_reflexes" integer DEFAULT 0,
	"voice_savoir_faire" integer DEFAULT 0,
	"voice_perception" integer DEFAULT 0,
	"voice_speed" integer DEFAULT 0,
	"voice_composure" integer DEFAULT 0,
	"voice_authority" integer DEFAULT 0,
	"voice_inland_empire" integer DEFAULT 0,
	"voice_empathy" integer DEFAULT 0,
	"voice_esprit_de_corps" integer DEFAULT 0,
	"voice_volition" integer DEFAULT 0,
	"voice_cope" integer DEFAULT 0,
	"voice_logic" integer DEFAULT 0,
	"voice_rhetoric" integer DEFAULT 0,
	"voice_drama" integer DEFAULT 0,
	"voice_encyclopedia" integer DEFAULT 0,
	"voice_visual_calculus" integer DEFAULT 0,
	"voice_conceptualization" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "game_progress" ADD CONSTRAINT "game_progress_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_session_id_trade_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."trade_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_sessions" ADD CONSTRAINT "trade_sessions_initiator_id_players_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_sessions" ADD CONSTRAINT "trade_sessions_partner_id_players_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_sender_id_players_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_receiver_id_players_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_discoveries" ADD CONSTRAINT "point_discoveries_point_key_map_points_id_fk" FOREIGN KEY ("point_key") REFERENCES "public"."map_points"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_progress" ADD CONSTRAINT "quest_progress_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_host_id_players_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_logs" ADD CONSTRAINT "scene_logs_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weapon_mastery" ADD CONSTRAINT "weapon_mastery_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_checks_log" ADD CONSTRAINT "resonance_checks_log_session_id_resonance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resonance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_checks_log" ADD CONSTRAINT "resonance_checks_log_player_id_resonance_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."resonance_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_interrupts" ADD CONSTRAINT "resonance_interrupts_session_id_resonance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resonance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_interrupts" ADD CONSTRAINT "resonance_interrupts_player_id_resonance_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."resonance_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_item_uses" ADD CONSTRAINT "resonance_item_uses_session_id_resonance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resonance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_item_uses" ADD CONSTRAINT "resonance_item_uses_player_id_resonance_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."resonance_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_item_uses" ADD CONSTRAINT "resonance_item_uses_item_id_resonance_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."resonance_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_kudos" ADD CONSTRAINT "resonance_kudos_session_id_resonance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resonance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_kudos" ADD CONSTRAINT "resonance_kudos_from_player_resonance_players_id_fk" FOREIGN KEY ("from_player") REFERENCES "public"."resonance_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_kudos" ADD CONSTRAINT "resonance_kudos_to_player_resonance_players_id_fk" FOREIGN KEY ("to_player") REFERENCES "public"."resonance_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_player_items" ADD CONSTRAINT "resonance_player_items_session_id_resonance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resonance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_player_items" ADD CONSTRAINT "resonance_player_items_player_id_resonance_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."resonance_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_player_items" ADD CONSTRAINT "resonance_player_items_item_id_resonance_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."resonance_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_players" ADD CONSTRAINT "resonance_players_session_id_resonance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resonance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_proxemic_log" ADD CONSTRAINT "resonance_proxemic_log_session_id_resonance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resonance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_proxemic_log" ADD CONSTRAINT "resonance_proxemic_log_player_id_resonance_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."resonance_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_strain_log" ADD CONSTRAINT "resonance_strain_log_session_id_resonance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resonance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_votes" ADD CONSTRAINT "resonance_votes_session_id_resonance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."resonance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resonance_votes" ADD CONSTRAINT "resonance_votes_player_id_resonance_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."resonance_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_instances" ADD CONSTRAINT "npc_instances_template_id_npc_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."npc_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "by_user_id" ON "players" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "by_device_id" ON "players" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "by_owner_id" ON "items" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "pd_user_point_idx" ON "point_discoveries" USING btree ("user_id","point_key");--> statement-breakpoint
CREATE INDEX "pd_device_point_idx" ON "point_discoveries" USING btree ("device_id","point_key");--> statement-breakpoint
CREATE INDEX "qp_player_idx" ON "quest_progress" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "bp_battle_idx" ON "battle_participants" USING btree ("battle_id");--> statement-breakpoint
CREATE INDEX "bp_player_idx" ON "battle_participants" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "scene_logs_player_idx" ON "scene_logs" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "scene_logs_user_idx" ON "scene_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scene_logs_scene_idx" ON "scene_logs" USING btree ("scene_id");--> statement-breakpoint
CREATE INDEX "mastery_by_player" ON "weapon_mastery" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "res_checks_session_idx" ON "resonance_checks_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "res_checks_scene_idx" ON "resonance_checks_log" USING btree ("scene_key");--> statement-breakpoint
CREATE INDEX "res_item_use_session_idx" ON "resonance_item_uses" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "res_kudos_session_idx" ON "resonance_kudos" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "res_player_items_session_idx" ON "resonance_player_items" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "res_player_items_player_idx" ON "resonance_player_items" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "res_player_items_unique" ON "resonance_player_items" USING btree ("session_id","player_id","item_id");--> statement-breakpoint
CREATE INDEX "res_players_session_idx" ON "resonance_players" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "res_players_device_idx" ON "resonance_players" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "res_prox_session_idx" ON "resonance_proxemic_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "res_scenes_episode_idx" ON "resonance_scenes" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "res_scenes_episode_key_idx" ON "resonance_scenes" USING btree ("episode_id","scene_key");--> statement-breakpoint
CREATE INDEX "res_strain_session_idx" ON "resonance_strain_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "res_votes_session_scene_idx" ON "resonance_votes" USING btree ("session_id","scene_key");