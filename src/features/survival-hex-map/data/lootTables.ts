import type { BiomeType, ResourceType } from '../types'

// Partial loot table - only biomes with specific loot defined
export const BIOME_LOOT: Partial<Record<BiomeType, string[]>> = {
    FOREST: ['Wood', 'Resin', 'Wild Berries', 'Herbs', 'Small Game'],
    WASTELAND: ['Scrap Metal', 'Rags', 'Plastic Waste', 'Rocks'],
    URBAN: ['Old Clothes', 'Rotting Food', 'Glass', 'Paper'],
    INDUSTRIAL: ['Rusty Bolts', 'Wire', 'Metal Pipe', 'Oil Sludge'],
    WATER: ['Dirty Water', 'Sand', 'Driftwood'],
    BUNKER: ['Old Documents', 'Office Supplies', 'Empty Casings'],
    HOSPITAL: ['Bandages', 'Expired Medicine', 'Medical Supplies'],
    POLICE: ['Empty Shells', 'Old Uniform', 'Handcuffs'],
    RIVER: ['Fish', 'Driftwood', 'Muddy Water'],
    FACTORY: ['Scrap Metal', 'Oil', 'Rubber'],
    CITY_HIGH: ['Electronics', 'Fine Clothes', 'Cash'],
    ADMIN: ['Documents', 'Office Supplies', 'Keys'],
    SKYSCRAPER: ['Electronics', 'Office Supplies', 'Cables'],
    FIRE_STATION: ['Fire Axe', 'Rope', 'First Aid Kit'],
    MALL: ['Food Scraps', 'Clothes', 'Tools'],
    RAILWAY_DEPOT: ['Metal Parts', 'Coal', 'Rope'],
    BUILDING_LOW: ['Old Furniture', 'Clothes', 'Kitchen Tools'],
    PARKING_LOW: ['Car Parts', 'Oil', 'Cables'],
    WAREHOUSE: ['Crates', 'Packaging', 'Random Goods'],
    GAS_STATION: ['Fuel', 'Snacks', 'Tools'],
    SCAVENGER_CAMP: ['Mixed Loot', 'Trade Goods', 'Weapons'],
    ARMY_BASE: ['Ammo', 'MRE', 'Military Gear'],
    AIRPORT: ['Electronics', 'Luggage', 'Tools'],
    ROAD_HIGH: ['Road Debris', 'Scrap'],
    ROAD_LOW: ['Road Debris', 'Rocks'],
    ROAD_CITY: ['Urban Debris', 'Glass'],
    ROAD_FOREST: ['Branches', 'Leaves'],
}

export const RESOURCE_LOOT: Record<ResourceType, string[]> = {
    NONE: [],
    SCRAP: ['Scrap Metal', 'Components', 'Copper Wire'],
    FOOD: ['Canned Beans', 'Dried Meat', 'MRE'],
    WATER: ['Purified Water', 'Filter'],
    FUEL: ['Gasoline', 'Kerosene', 'Battery'],
    TECH: ['Circuit Board', 'Microchip', 'Optical Lens'],
}

export const getPossibleLoot = (biome: BiomeType, resource: ResourceType): string[] => {
    const baseLoot = BIOME_LOOT[biome] || []
    const resLoot = RESOURCE_LOOT[resource] || []

    // Combine and deduplicate, prioritizing resource loot
    const combined = Array.from(new Set([...resLoot, ...baseLoot]))

    // Return top 4 distinct items as "potential finds"
    return combined.slice(0, 4)
}
