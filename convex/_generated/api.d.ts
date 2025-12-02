/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as battleSystem from "../battleSystem.js";
import type * as combat from "../combat.js";
import type * as combatSeed from "../combatSeed.js";
import type * as gameProgress from "../gameProgress.js";
import type * as inventory from "../inventory.js";
import type * as mapPoints from "../mapPoints.js";
import type * as mapPointsSeed from "../mapPointsSeed.js";
import type * as player from "../player.js";
import type * as presence from "../presence.js";
import type * as pvp from "../pvp.js";
import type * as quests from "../quests.js";
import type * as questsSeed from "../questsSeed.js";
import type * as seedData from "../seedData.js";
import type * as templates from "../templates.js";
import type * as vn from "../vn.js";
import type * as zones from "../zones.js";
import type * as zonesSeed from "../zonesSeed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  battleSystem: typeof battleSystem;
  combat: typeof combat;
  combatSeed: typeof combatSeed;
  gameProgress: typeof gameProgress;
  inventory: typeof inventory;
  mapPoints: typeof mapPoints;
  mapPointsSeed: typeof mapPointsSeed;
  player: typeof player;
  presence: typeof presence;
  pvp: typeof pvp;
  quests: typeof quests;
  questsSeed: typeof questsSeed;
  seedData: typeof seedData;
  templates: typeof templates;
  vn: typeof vn;
  zones: typeof zones;
  zonesSeed: typeof zonesSeed;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
