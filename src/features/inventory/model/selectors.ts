import type { ItemKind, ItemState } from '@/entities/item/model/types'

export type InventoryFilter = ItemKind | 'all'

const normalize = (value: string) => value.trim().toLowerCase()

export const filterItems = (
  items: Record<string, ItemState>,
  searchQuery: string,
  filter: InventoryFilter
): ItemState[] => {
  const query = normalize(searchQuery)
  const list = Object.values(items)

  return list.filter((item) => {
    const matchesFilter = filter === 'all' ? true : item.kind === filter
    const matchesQuery =
      query.length === 0 ||
      normalize(item.name).includes(query) ||
      (item.tags ? item.tags.some((tag) => normalize(tag).includes(query)) : false)

    return matchesFilter && matchesQuery
  })
}
