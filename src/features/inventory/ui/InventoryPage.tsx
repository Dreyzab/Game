import React, { useMemo, useState, useEffect } from 'react'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { useInventoryStore } from '@/shared/stores/inventoryStore'
import { useQuestItemProtection } from '@/features/quests/lib/questItemProtection'
import { filterItems } from '@/features/inventory/model/selectors'
import { AnimatedCard } from '@/shared/components/AnimatedCard'
import { MotionContainer } from '@/shared/components/MotionContainer'
import EnhancedInventoryGrid from './EnhancedInventoryGrid'
import CharacterPanel from './CharacterPanel'
import QuickStatsPanel from './QuickStatsPanel'
import InventoryDetailPanel from './InventoryDetailPanel'
import InventoryContainer from './InventoryContainer'

export const ModernInventoryPage: React.FC = () => {
  const {
    items,
    equipment,
    encumbrance,
    containers,
    playerStats,
    activeMasteryCards,
    selectedItemId,
    selectItem,
    searchQuery,
    activeFilter,
    setSearchQuery,
    setActiveFilter,
    isQuestItem,
  } = useInventoryStore()

  useQuestItemProtection()

  const [activeContainerId, setActiveContainerId] = useState<string | null>(null)

  const allItems = useMemo(() => Object.values(items), [items])
  const filteredItems = useMemo(
    () => filterItems(items, searchQuery, activeFilter),
    [items, searchQuery, activeFilter]
  )

  useEffect(() => {
    if (selectedItemId && items[selectedItemId]) return
    const firstId = Object.keys(items)[0] ?? null
    if (firstId !== selectedItemId) {
      selectItem(firstId)
    }
  }, [items, selectedItemId, selectItem])

  const selectedItem = selectedItemId ? items[selectedItemId] ?? null : null

  return (
    <Layout>
      <MotionContainer className="mb-6 space-y-3 text-center">
        <Heading level={1}>Inventory Console · Modern</Heading>
        <Text variant="muted" size="sm" className="uppercase tracking-[0.28em]">
          Grid · Character · Mastery
        </Text>
      </MotionContainer>

      <div className="mb-4 space-y-3">
        <AnimatedCard className="glass-panel space-y-3 p-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or tag..."
            className="w-full rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-[color:var(--color-text-primary)] focus:border-amber-500 focus:outline-none"
          />
        </AnimatedCard>
        <QuickStatsPanel stats={playerStats} encumbrance={encumbrance} />
        <InventoryContainer
          containers={containers}
          activeId={activeContainerId}
          onChange={setActiveContainerId}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]">
        <AnimatedCard className="glass-panel p-4">
          <EnhancedInventoryGrid
            items={filteredItems}
            selectedItemId={selectedItemId}
            onSelect={selectItem}
            isQuestItem={isQuestItem}
          />
        </AnimatedCard>

        <div className="space-y-4">
          <AnimatedCard className="glass-panel p-4">
            <InventoryDetailPanel
              item={selectedItem ?? null}
              isQuestItem={selectedItem ? isQuestItem(selectedItem.id) : false}
            />
          </AnimatedCard>
          <CharacterPanel
            equipment={equipment}
            encumbrance={encumbrance}
            stats={playerStats}
            masteryCards={activeMasteryCards}
          />
        </div>
      </div>
    </Layout>
  )
}

export default ModernInventoryPage

