import { describe, expect, test } from "bun:test";
import { synthesizeCard } from "../../src/services/combat/CardFactory";

describe("CardFactory", () => {
    test("synthesizeCard should create a card with correct stats", () => {
        const weapon = {
            name: "Pistol",
            type: "RANGED",
            baseDamage: 10,
            damageType: "PHYSICAL" as const,
            validRanks: [2, 3],
            baseAp: 2,
            baseStamina: 0,
            defaultEffects: [],
            condition: 100,
            heat: 0
        };

        const voices = {
            voiceMight: 5,
            voiceTech: 2
        };

        const card = synthesizeCard(weapon, null, voices);

        expect(card.name).toBe("Pistol");
        expect(card.damage).toBe(10);
        expect(card.apCost).toBe(2);
        expect(card.jamChance).toBeLessThan(5); // (100-100)*0.2 + 0 - 1 = -1 -> 0
    });

    test("synthesizeCard should calculate Jam Chance correctly", () => {
        const weapon = {
            name: "Old Rifle",
            type: "RANGED",
            baseDamage: 15,
            damageType: "PHYSICAL" as const,
            validRanks: [3, 4],
            baseAp: 3,
            baseStamina: 1,
            defaultEffects: [],
            condition: 50, // Worn
            heat: 50 // Hot
        };

        const voices = {
            voiceMight: 2,
            voiceTech: 10 // High tech skill
        };

        // Jam Equation: (100-50)*0.2 + 50*0.1 - 10*0.5 
        // = 10 + 5 - 5 = 10%

        const card = synthesizeCard(weapon, null, voices);

        expect(card.jamChance).toBe(10);
    });
});
