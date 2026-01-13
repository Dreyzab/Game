import { BiomeType, ResourceType } from '../types'

export const BIOME_LOOT: Record<BiomeType, string[]> = {
    [BiomeType.FOREST]: ['Wood', 'Resin', 'Wild Berries', 'Herbs', 'Small Game'],
    [BiomeType.WASTELAND]: ['Scrap Metal', 'Rags', 'Plastic Waste', 'Rocks'],
    [BiomeType.URBAN]: ['Old Clothes', 'Rotting Food', 'Glass', 'Paper'],
    [BiomeType.INDUSTRIAL]: ['Rusty Bolts', 'Wire', 'Metal Pipe', 'Oil Sludge'],
    [BiomeType.WATER]: ['Dirty Water', 'Sand', 'Driftwood'],
    [BiomeType.BUNKER]: ['Old Documents', 'Office Supplies', 'Empty Casings'],
}

export const RESOURCE_LOOT: Record<ResourceType, string[]> = {
    [ResourceType.NONE]: [],
    [ResourceType.SCRAP]: ['Scrap Metal', 'Components', 'Copper Wire'],
    [ResourceType.FOOD]: ['Canned Beans', 'Dried Meat', 'MRE'],
    [ResourceType.WATER]: ['Purified Water', 'Filter'],
    [ResourceType.FUEL]: ['Gasoline', 'Kerosene', 'Battery'],
    [ResourceType.TECH]: ['Circuit Board', 'Microchip', 'Optical Lens'],
}

export const getPossibleLoot = (biome: BiomeType, resource: ResourceType): string[] => {
    const baseLoot = BIOME_LOOT[biome] || []
    const resLoot = RESOURCE_LOOT[resource] || []

    // Combine and deduplicate, prioritizing resource loot
    const combined = Array.from(new Set([...resLoot, ...baseLoot]))

    // Return top 4 distinct items as "potential finds"
    return combined.slice(0, 4)
}
