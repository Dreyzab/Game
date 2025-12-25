import { describe, expect, test } from "bun:test";
import { SEED_MAP_POINTS } from "../../src/seeds/mapPoints";

describe("MapPoint QR codes", () => {
    test("qrRequired points must have a configured qrCode", () => {
        const missing: string[] = [];

        for (const point of SEED_MAP_POINTS) {
            const meta = (point.metadata ?? {}) as any;
            if (meta.qrRequired !== true) continue;

            const qrCode = point.qrCode ?? meta.qrCode ?? meta?.activation?.qrCodeId;
            if (typeof qrCode !== "string" || qrCode.trim().length === 0) {
                missing.push(point.id);
            }
        }

        expect(missing, `Missing qrCode for: ${missing.join(", ")}`).toEqual([]);
    });

    test("configured qrCode values must be unique", () => {
        const seen = new Map<string, string>();
        const duplicates: Array<{ qrCode: string; a: string; b: string }> = [];

        for (const point of SEED_MAP_POINTS) {
            const meta = (point.metadata ?? {}) as any;
            const qrCodeRaw = point.qrCode ?? meta.qrCode ?? meta?.activation?.qrCodeId;
            if (typeof qrCodeRaw !== "string") continue;
            const qrCode = qrCodeRaw.trim();
            if (!qrCode) continue;

            const existing = seen.get(qrCode);
            if (existing && existing !== point.id) {
                duplicates.push({ qrCode, a: existing, b: point.id });
            } else {
                seen.set(qrCode, point.id);
            }
        }

        expect(duplicates).toEqual([]);
    });
});

