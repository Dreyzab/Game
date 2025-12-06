import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

type BBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

const polygonIntersectsBBox = (
  polygon: Array<{ lat: number; lng: number }>,
  bbox?: BBox
) => {
  if (!bbox || polygon.length === 0) return true;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const point of polygon) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  return !(
    maxLat < bbox.minLat ||
    minLat > bbox.maxLat ||
    maxLng < bbox.minLng ||
    minLng > bbox.maxLng
  );
};

const fetchActiveSafeZones = async (
  ctx: { db: any },
  bbox?: BBox
) => {
  const zones = await ctx.db
    .query("safe_zones")
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .collect();

  return zones.filter((z: any) => polygonIntersectsBBox(z.polygon, bbox));
};

/**
 * Get all zones
 */
export const getZones = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("zones").collect();
  },
});

/**
 * Attempt to capture a zone (called after winning a battle)
 */
export const attemptCapture = mutation({
  args: {
    deviceId: v.string(),
    zoneId: v.id("zones"),
    factionId: v.string(), // "stalkers", "bandits", etc.
    damage: v.number(), // Amount to reduce stability
  },
  handler: async (ctx, args) => {
    const zone = await ctx.db.get(args.zoneId);
    if (!zone) throw new Error("Zone not found");

    if (zone.status === "locked") throw new Error("Zone is locked");

    let newHealth = zone.health;
    let newOwner = zone.ownerFactionId;
    let newStatus = zone.status;

    if (zone.ownerFactionId === args.factionId) {
      // Reinforce
      newHealth = Math.min(100, zone.health + args.damage);
    } else {
      // Attack
      newHealth = Math.max(0, zone.health - args.damage);
      if (newHealth === 0) {
        // Flip ownership
        newOwner = args.factionId;
        newHealth = 20; // Start with low stability
        newStatus = "contested";
      } else {
        newStatus = "contested";
      }
    }

    await ctx.db.patch(args.zoneId, {
      health: newHealth,
      ownerFactionId: newOwner,
      status: newStatus,
      lastCapturedAt: Date.now(),
    });

    return { success: true, newHealth, newOwner };
  },
});

/**
 * List active safe zones, optionally filtered by bounding box
 */
export const listSafeZones = query({
  args: {
    bbox: v.optional(
      v.object({
        minLat: v.number(),
        maxLat: v.number(),
        minLng: v.number(),
        maxLng: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return fetchActiveSafeZones(ctx, args.bbox);
  },
});

/**
 * Alias for active safe zones (used by map layer)
 */
export const listActiveSafeZones = query({
  args: {
    bbox: v.optional(
      v.object({
        minLat: v.number(),
        maxLat: v.number(),
        minLng: v.number(),
        maxLng: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return fetchActiveSafeZones(ctx, args.bbox);
  },
});

/**
 * List active danger zones, optionally filtered by bounding box
 */
export const listDangerZones = query({
  args: {
    bbox: v.optional(
      v.object({
        minLat: v.number(),
        maxLat: v.number(),
        minLng: v.number(),
        maxLng: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const zones = await ctx.db
      .query("danger_zones")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return zones.filter((z) => polygonIntersectsBBox(z.polygon, args.bbox));
  },
});

/**
 * Seed initial zones
 */
export const seedZones = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("zones").first();
    if (existing) return; // Already seeded

    // Example Zones around a central point (approx Moscow/Game Area)
    // Adjust coordinates to match your game's map center
    const centerLat = 55.75;
    const centerLng = 37.61;

    await ctx.db.insert("zones", {
      name: "Central Hub",
      center: { lat: centerLat, lng: centerLng },
      radius: 500,
      ownerFactionId: "stalkers",
      status: "peace",
      health: 100,
      lastCapturedAt: Date.now(),
    });

    await ctx.db.insert("zones", {
      name: "Industrial Sector",
      center: { lat: centerLat + 0.01, lng: centerLng + 0.01 },
      radius: 300,
      ownerFactionId: "bandits",
      status: "contested",
      health: 50,
      lastCapturedAt: Date.now(),
    });

    await ctx.db.insert("zones", {
      name: "Wilderness Outpost",
      center: { lat: centerLat - 0.01, lng: centerLng - 0.01 },
      radius: 400,
      ownerFactionId: undefined,
      status: "peace",
      health: 0,
      lastCapturedAt: Date.now(),
    });
  }
});
