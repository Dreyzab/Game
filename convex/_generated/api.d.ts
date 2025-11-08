/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as gameProgress from "../gameProgress.js";
import type * as mapPoints from "../mapPoints.js";
import type * as mapPointsSeed from "../mapPointsSeed.js";
import type * as seedData from "../seedData.js";
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
  gameProgress: typeof gameProgress;
  mapPoints: typeof mapPoints;
  mapPointsSeed: typeof mapPointsSeed;
  seedData: typeof seedData;
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
