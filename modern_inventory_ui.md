# Современный компонент InventoryPage в стиле Tarkov/Baldur's Gate/Stalker

## 📁 Файловая структура

```
src/
├── features/inventory/
│   ├── ui/
│   │   ├── InventoryPage.tsx              # Главная страница (этот файл)
│   │   ├── EnhancedInventoryGrid.tsx      # Сетка инвентаря
│   │   ├── CharacterPanel.tsx             # Панель персонажа с слотами
│   │   ├── QuickStatsPanel.tsx            # Быстрая статистика
│   │   ├── InventoryDetailPanel.tsx       # Детальная информация о предмете
│   │   ├── EquipmentSlot.tsx              # Отдельный слот экипировки
│   │   └── InventoryContainer.tsx         # Выбор контейнера
│   └── model/
│       └── types.ts                       # Типы для инвентаря
└── shared/components/
    ├── AnimatedCard.tsx                   # Карточка с анимацией
    ├── MotionContainer.tsx                # Контейнер с Motion
    └── DetailedTooltip.tsx                # Подробная подсказка
```

## 🎨 Главный компонент: InventoryPage.tsx

```typescript
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3X3, Package, User, TrendingUp, Weight, DollarSign,
  Zap, Shield, Backpack, Settings
} from 'lucide-react';
import clsx from 'clsx';

import { useInventoryStore } from '@/shared/stores/inventoryStore';
import { useInventoryOutbox } from '@/shared/stores/inventoryOutbox';
import EnhancedInventoryGrid from './EnhancedInventoryGrid';
import CharacterPanel from './CharacterPanel';
import QuickStatsPanel from './QuickStatsPanel';
import InventoryDetailPanel from './InventoryDetailPanel';
import InventoryContainer from './InventoryContainer';
import AnimatedCard from '@/shared/components/AnimatedCard';
import MotionContainer from '@/shared/components/MotionContainer';

interface InventoryPageProps {
  playerId: string;
  maxBackpackWeight?: number;
  maxBackpackSlots?: number;
}

export default function InventoryPage({
  playerId,
  maxBackpackWeight = 100,
  maxBackpackSlots = 60,
}: InventoryPageProps) {
  // ============ STATE ============
  const store = useInventoryStore();
  const outbox = useInventoryOutbox();
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeContainer, setActiveContainer] = useState<'main' | 'backpack' | 'rig'>('main');
  const [showSettings, setShowSettings] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'weight' | 'rarity' | 'name'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // ============ COMPUTED VALUES ============
  
  // Расчет характеристик инвентаря
  const inventoryStats = useMemo(() => {
    const allItems = Object.values(store.items);
    const totalWeight = allItems.reduce((acc, item) => 
      acc + (item.stats?.weight || 0) * item.quantity, 0
    );
    const totalValue = allItems.reduce((acc, item) =>
      acc + (item.value || 0) * item.quantity, 0
    );

    // Определить уровень нагрузки
    const weightRatio = totalWeight / maxBackpackWeight;
    let encumbranceLevel = 'light';
    if (weightRatio <= 0.5) encumbranceLevel = 'light';
    else if (weightRatio <= 0.8) encumbranceLevel = 'normal';
    else if (weightRatio <= 1.0) encumbranceLevel = 'strained';
    else if (weightRatio <= 1.2) encumbranceLevel = 'overloaded';
    else encumbranceLevel = 'immobile';

    return {
      totalItems: allItems.length,
      totalWeight,
      totalValue,
      maxWeight: maxBackpackWeight,
      weightRatio,
      encumbranceLevel,
      usedSlots: allItems.length,
      maxSlots: maxBackpackSlots,
      equippedCount: Object.values(store.equipment || {}).filter(Boolean).length,
    };
  }, [store.items, store.equipment, maxBackpackWeight, maxBackpackSlots]);

  // Фильтрация и сортировка предметов
  const filteredAndSortedItems = useMemo(() => {
    let items = Object.values(store.items);

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    // Сортировка
    switch (sortBy) {
      case 'weight':
        items.sort((a, b) => (b.stats?.weight || 0) - (a.stats?.weight || 0));
        break;
      case 'rarity':
        const rarityOrder: Record<string, number> = {
          common: 0,
          uncommon: 1,
          rare: 2,
          epic: 3,
          legendary: 4,
        };
        items.sort((a, b) => 
          (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
        );
        break;
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
      default:
        // Сохранить исходный порядок
        break;
    }

    return items;
  }, [store.items, searchQuery, sortBy]);

  // Выбранный предмет
  const selectedItem = selectedItemId ? store.items[selectedItemId] : null;

  // ============ HANDLERS ============

  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
  }, []);

  const handleEquipItem = useCallback((itemId: string, slotId: string) => {
    store.equipItem(itemId, slotId as any);
    outbox.enqueue({
      type: 'item_equipped',
      payload: { itemId, slotId },
    });
  }, [store, outbox]);

  const handleDropItem = useCallback((itemId: string) => {
    store.removeItem(itemId, 1);
    outbox.enqueue({
      type: 'item_removed',
      payload: { itemId, quantity: 1 },
    });
  }, [store, outbox]);

  const getEncumbranceColor = (level: string): string => {
    switch (level) {
      case 'light':
        return 'text-green-400';
      case 'normal':
        return 'text-blue-400';
      case 'strained':
        return 'text-yellow-400';
      case 'overloaded':
        return 'text-orange-400';
      case 'immobile':
        return 'text-red-400';
      default:
        return 'text-zinc-400';
    }
  };

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4">
      {/* Заголовок */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Backpack className="text-amber-400" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-white">Инвентарь</h1>
              <p className="text-zinc-400 text-sm">
                Управляй своим снаряжением и добычей
              </p>
            </div>
          </div>

          {/* Кнопка синхронизации */}
          {outbox.isSyncing && (
            <motion.div
              className="px-4 py-2 bg-blue-500/20 border border-blue-500 rounded text-blue-300 text-sm flex items-center gap-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                <Zap size={16} />
              </motion.div>
              Синхронизация...
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Основная сетка с 3 колонками */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Левая колонка: Инвентарь */}
        <div className="xl:col-span-3 space-y-4">
          {/* Панель управления */}
          <AnimatedCard variant="default" className="bg-zinc-900/50 border-zinc-700">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="text-amber-400" size={20} />
                  <h2 className="text-lg font-semibold text-zinc-100">
                    Основной инвентарь
                  </h2>
                  <span className="text-sm text-zinc-400">
                    ({filteredAndSortedItems.length} предметов)
                  </span>
                </div>

                <motion.button
                  className="p-2 hover:bg-zinc-700/50 rounded transition-colors"
                  onClick={() => setShowSettings(!showSettings)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings size={18} className="text-zinc-400" />
                </motion.button>
              </div>

              {/* Панель поиска и фильтров */}
              <div className="space-y-3">
                {/* Поиск */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск предметов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-zinc-800/50 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition"
                  />
                  <Package size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                </div>

                {/* Опции сортировки и отображения */}
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 bg-zinc-800/50 border border-zinc-600 rounded text-sm text-zinc-100 hover:border-amber-500 transition"
                  >
                    <option value="recent">По времени</option>
                    <option value="weight">По весу</option>
                    <option value="rarity">По редкости</option>
                    <option value="name">По названию</option>
                  </select>

                  <select
                    value={activeContainer}
                    onChange={(e) => setActiveContainer(e.target.value as any)}
                    className="px-3 py-1 bg-zinc-800/50 border border-zinc-600 rounded text-sm text-zinc-100 hover:border-amber-500 transition"
                  >
                    <option value="main">Главный</option>
                    <option value="backpack">Рюкзак</option>
                    <option value="rig">Разгрузка</option>
                  </select>
                </div>

                {/* Статус синхронизации */}
                {outbox.outbox.length > 0 && (
                  <div className="text-xs text-amber-400 bg-amber-400/10 px-3 py-2 rounded border border-amber-400/30">
                    📤 {outbox.outbox.length} событий в очереди синхронизации
                  </div>
                )}
              </div>
            </div>
          </AnimatedCard>

          {/* Сетка инвентаря */}
          <EnhancedInventoryGrid
            items={filteredAndSortedItems}
            onItemSelect={handleItemSelect}
            selectedItemId={selectedItemId}
            containerType={activeContainer}
            maxSlots={maxBackpackSlots}
            currentWeight={inventoryStats.totalWeight}
            maxWeight={inventoryStats.maxWeight}
          />
        </div>

        {/* Правая колонка: Панель персонажа */}
        <div className="xl:col-span-1 space-y-4">
          <MotionContainer className="space-y-4" stagger={0.05}>
            {/* Панель персонажа с экипировкой */}
            <CharacterPanel
              equipment={store.equipment}
              onEquipSlotClick={handleEquipItem}
            />

            {/* Быстрая статистика */}
            <QuickStatsPanel
              stats={inventoryStats}
              encumbranceColor={getEncumbranceColor(inventoryStats.encumbranceLevel)}
            />

            {/* Выбранный предмет */}
            {selectedItem && (
              <InventoryDetailPanel
                item={selectedItem}
                onEquip={() => {
                  // Отправить в главный слот экипировки
                  if (selectedItem.kind === 'weapon') {
                    handleEquipItem(selectedItem.id, 'primary');
                  }
                }}
                onDrop={() => handleDropItem(selectedItem.id)}
              />
            )}
          </MotionContainer>
        </div>
      </div>
    </div>
  );
}
```

## 🎯 Компонент CharacterPanel.tsx

```typescript
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User, Shield, Sword, Zap, Package, Briefcase, Heart, Eye
} from 'lucide-react';
import clsx from 'clsx';

import AnimatedCard from '@/shared/components/AnimatedCard';
import MotionContainer from '@/shared/components/MotionContainer';

interface EquipmentSlot {
  id: string;
  label: string;
  icon: React.ReactNode;
  position: { x: number; y: number };
  size: { w: number; h: number };
}

interface CharacterPanelProps {
  equipment: Record<string, any>;
  onEquipSlotClick?: (itemId: string, slotId: string) => void;
}

const equipmentSlots: EquipmentSlot[] = [
  {
    id: 'helmet',
    label: 'Шлем',
    icon: <Shield size={16} />,
    position: { x: 1, y: 0 },
    size: { w: 1, h: 1 },
  },
  {
    id: 'clothingTop',
    label: 'Верх',
    icon: <Package size={16} />,
    position: { x: 1, y: 1 },
    size: { w: 1, h: 1 },
  },
  {
    id: 'armor',
    label: 'Броня',
    icon: <Shield size={16} />,
    position: { x: 1, y: 2 },
    size: { w: 1, h: 1 },
  },
  {
    id: 'clothingBottom',
    label: 'Низ',
    icon: <Package size={16} />,
    position: { x: 1, y: 3 },
    size: { w: 1, h: 1 },
  },
  {
    id: 'primary',
    label: 'Основное',
    icon: <Sword size={16} />,
    position: { x: 0, y: 1 },
    size: { w: 1, h: 2 },
  },
  {
    id: 'secondary',
    label: 'Запасное',
    icon: <Sword size={16} />,
    position: { x: 2, y: 1 },
    size: { w: 1, h: 2 },
  },
  {
    id: 'backpack',
    label: 'Рюкзак',
    icon: <Briefcase size={16} />,
    position: { x: 3, y: 1 },
    size: { w: 1, h: 2 },
  },
  {
    id: 'rig',
    label: 'Разгрузка',
    icon: <Package size={16} />,
    position: { x: 0, y: 3 },
    size: { w: 1, h: 1 },
  },
];

export default function CharacterPanel({
  equipment,
  onEquipSlotClick,
}: CharacterPanelProps) {
  const renderEquipmentSlot = (slot: EquipmentSlot) => {
    const equippedItemId = equipment?.[slot.id];
    const isEquipped = !!equippedItemId;

    return (
      <motion.div
        key={slot.id}
        className="relative"
        style={{
          gridColumn: `${slot.position.x + 1} / span ${slot.size.w}`,
          gridRow: `${slot.position.y + 1} / span ${slot.size.h}`,
        }}
        whileHover={{ scale: 1.02 }}
      >
        <div
          className={clsx(
            'w-full h-full border-2 border-dashed rounded-lg',
            'flex flex-col items-center justify-center p-2 min-h-[80px]',
            'transition-all duration-200 cursor-pointer',
            isEquipped
              ? 'bg-zinc-800/50 border-zinc-500 hover:border-amber-400'
              : 'bg-zinc-900/30 border-zinc-600 hover:border-zinc-500'
          )}
        >
          {isEquipped ? (
            <div className="text-center w-full">
              <div className="text-emerald-400 font-bold text-xs mb-1">✓</div>
              <div className="text-zinc-300 text-xs text-center truncate w-full">
                {slot.label}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center opacity-50">
              <div className="text-zinc-500 mb-1">{slot.icon}</div>
              <div className="text-xs text-zinc-500 text-center">{slot.label}</div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatedCard variant="glow" className="bg-zinc-900/50 border-zinc-700">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-emerald-400" size={20} />
          <h3 className="text-lg font-semibold text-zinc-100">Персонаж</h3>
        </div>

        {/* Сетка слотов экипировки */}
        <div
          className="grid gap-2 mx-auto max-w-xs"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
          }}
        >
          {equipmentSlots.map(renderEquipmentSlot)}
        </div>

        {/* Характеристики персонажа */}
        <div className="mt-4 space-y-2 text-xs border-t border-zinc-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 flex items-center gap-1">
              <Heart size={14} /> Здоровье
            </span>
            <span className="text-red-400 font-semibold">100/100</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 flex items-center gap-1">
              <Shield size={14} /> Защита
            </span>
            <span className="text-blue-400 font-semibold">25</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 flex items-center gap-1">
              <Eye size={14} /> Скрытность
            </span>
            <span className="text-purple-400 font-semibold">+15%</span>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}
```

## 📊 Компонент QuickStatsPanel.tsx

```typescript
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Weight, DollarSign, Package } from 'lucide-react';

import AnimatedCard from '@/shared/components/AnimatedCard';

interface QuickStatsPanelProps {
  stats: {
    totalItems: number;
    totalWeight: number;
    totalValue: number;
    maxWeight: number;
    weightRatio: number;
    encumbranceLevel: string;
    usedSlots: number;
    maxSlots: number;
    equippedCount: number;
  };
  encumbranceColor: string;
}

export default function QuickStatsPanel({
  stats,
  encumbranceColor,
}: QuickStatsPanelProps) {
  return (
    <AnimatedCard className="bg-zinc-900/50 border-zinc-700">
      <div className="p-4">
        <h4 className="text-sm font-medium text-zinc-100 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-400" />
          Быстрая статистика
        </h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400 flex items-center gap-1">
              <Package size={14} /> Предметов:
            </span>
            <span className="text-zinc-100 font-semibold">{stats.totalItems}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400 flex items-center gap-1">
              <Weight size={14} /> Вес:
            </span>
            <span className={`${encumbranceColor} font-semibold`}>
              {stats.totalWeight.toFixed(1)} / {stats.maxWeight} кг
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400 flex items-center gap-1">
              <DollarSign size={14} /> Ценность:
            </span>
            <span className="text-emerald-400 font-semibold">{stats.totalValue} ₽</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Слотов:</span>
            <span className="text-zinc-100 font-semibold">
              {stats.usedSlots} / {stats.maxSlots}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Экипировка:</span>
            <span className="text-blue-400 font-semibold">{stats.equippedCount}/8</span>
          </div>
        </div>

        {/* Индикатор нагрузки */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-400">Нагрузка</span>
            <span className={encumbranceColor}>{stats.encumbranceLevel}</span>
          </div>

          <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full transition-all ${
                stats.encumbranceLevel === 'light'
                  ? 'bg-green-500'
                  : stats.encumbranceLevel === 'normal'
                  ? 'bg-blue-500'
                  : stats.encumbranceLevel === 'strained'
                  ? 'bg-yellow-500'
                  : stats.encumbranceLevel === 'overloaded'
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, (stats.weightRatio / 1.2) * 100)}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="text-xs text-zinc-400 mt-2">
            {stats.encumbranceLevel === 'light' && '✓ Легкая нагрузка'}
            {stats.encumbranceLevel === 'normal' && '○ Нормальная нагрузка'}
            {stats.encumbranceLevel === 'strained' && '⚠ Напряженная нагрузка'}
            {stats.encumbranceLevel === 'overloaded' && '⚠ Перегруженность'}
            {stats.encumbranceLevel === 'immobile' && '✕ Обездвиженность'}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}
```

## 📋 Компонент InventoryDetailPanel.tsx

```typescript
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Zap, Info } from 'lucide-react';
import clsx from 'clsx';

import AnimatedCard from '@/shared/components/AnimatedCard';

interface InventoryDetailPanelProps {
  item: any;
  onEquip?: () => void;
  onDrop?: () => void;
}

export default function InventoryDetailPanel({
  item,
  onEquip,
  onDrop,
}: InventoryDetailPanelProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-600 to-yellow-500';
      case 'epic':
        return 'from-purple-600 to-purple-500';
      case 'rare':
        return 'from-blue-600 to-blue-500';
      case 'uncommon':
        return 'from-green-600 to-green-500';
      default:
        return 'from-zinc-600 to-zinc-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-500';
      case 'epic':
        return 'border-purple-500';
      case 'rare':
        return 'border-blue-500';
      case 'uncommon':
        return 'border-green-500';
      default:
        return 'border-zinc-500';
    }
  };

  return (
    <AnimatedCard variant="default" className="bg-zinc-900/50 border-zinc-700">
      <div className="p-4">
        {/* Заголовок с рарностью */}
        <div
          className={clsx(
            'px-3 py-2 rounded-lg mb-3 border-2',
            `bg-gradient-to-r ${getRarityColor(item.rarity)}`,
            getRarityBorder(item.rarity)
          )}
        >
          <h3 className="text-white font-bold text-sm">{item.name}</h3>
          <p className="text-xs text-zinc-200 capitalize">{item.rarity}</p>
        </div>

        {/* Описание */}
        {item.description && (
          <p className="text-xs text-zinc-300 leading-relaxed mb-3 p-2 bg-zinc-800/30 rounded">
            {item.description}
          </p>
        )}

        {/* Характеристики */}
        <div className="space-y-1 text-xs mb-3 pb-3 border-b border-zinc-700">
          {item.stats?.damage && (
            <div className="flex justify-between">
              <span className="text-zinc-400">⚔️ Урон:</span>
              <span className="text-red-400 font-semibold">{item.stats.damage}</span>
            </div>
          )}
          {item.stats?.defense && (
            <div className="flex justify-between">
              <span className="text-zinc-400">🛡️ Защита:</span>
              <span className="text-blue-400 font-semibold">{item.stats.defense}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-400">⚖️ Вес:</span>
            <span className="text-amber-400">{item.stats?.weight || 0} кг</span>
          </div>
          {item.quantity > 1 && (
            <div className="flex justify-between">
              <span className="text-zinc-400">📦 Количество:</span>
              <span className="text-purple-400">{item.quantity}x</span>
            </div>
          )}
          {item.condition !== undefined && (
            <div className="flex justify-between">
              <span className="text-zinc-400">🔧 Состояние:</span>
              <span
                className={clsx(
                  'font-semibold',
                  item.condition > 75
                    ? 'text-green-400'
                    : item.condition > 50
                    ? 'text-yellow-400'
                    : item.condition > 25
                    ? 'text-orange-400'
                    : 'text-red-400'
                )}
              >
                {Math.round(item.condition)}%
              </span>
            </div>
          )}
        </div>

        {/* Действия */}
        <div className="space-y-2">
          {onEquip && (
            <motion.button
              onClick={onEquip}
              className="w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-semibold rounded transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap size={14} className="inline mr-1" />
              Надеть
            </motion.button>
          )}

          {onDrop && (
            <motion.button
              onClick={onDrop}
              className="w-full px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-semibold rounded transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 size={14} className="inline mr-1" />
              Выбросить
            </motion.button>
          )}
        </div>

        {/* Информационное сообщение */}
        <div className="mt-3 text-xs text-zinc-400 flex items-start gap-2 p-2 bg-blue-500/10 rounded border border-blue-500/30">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          <span>Нажми на предмет в сетке для просмотра подробностей</span>
        </div>
      </div>
    </AnimatedCard>
  );
}
```

## 🎁 Компонент EnhancedInventoryGrid.tsx (сокращенный вариант для конкретной реализации)

```typescript
'use client';

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Grid3X3 } from 'lucide-react';
import clsx from 'clsx';

import AnimatedCard from '@/shared/components/AnimatedCard';
import MotionContainer from '@/shared/components/MotionContainer';

interface EnhancedInventoryGridProps {
  items: any[];
  onItemSelect: (itemId: string) => void;
  selectedItemId: string | null;
  containerType: 'main' | 'backpack' | 'rig';
  maxSlots: number;
  currentWeight: number;
  maxWeight: number;
}

const GRID_COLS = 10;
const GRID_ROWS = 6;
const SLOT_SIZE = 60; // px

export default function EnhancedInventoryGrid({
  items,
  onItemSelect,
  selectedItemId,
  containerType,
  maxSlots,
  currentWeight,
  maxWeight,
}: EnhancedInventoryGridProps) {
  // Создать сетку слотов
  const gridSlots = useMemo(() => {
    const slots = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        slots.push({ x, y, id: `slot-${x}-${y}` });
      }
    }
    return slots;
  }, []);

  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'epic':
        return 'border-purple-500 bg-purple-500/10';
      case 'rare':
        return 'border-blue-500 bg-blue-500/10';
      case 'uncommon':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-zinc-600 bg-zinc-800/80';
    }
  };

  return (
    <AnimatedCard variant="default" className="bg-zinc-900/50 border-zinc-700">
      <div className="p-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Grid3X3 className="text-amber-400" size={20} />
            <h3 className="text-lg font-semibold text-zinc-100">
              {containerType === 'main' && 'Основной инвентарь'}
              {containerType === 'backpack' && 'Рюкзак'}
              {containerType === 'rig' && 'Разгрузка'}
            </h3>
            <span className="text-sm text-zinc-400">
              ({items.length}/{maxSlots} слотов)
            </span>
          </div>
        </div>

        {/* Сетка инвентаря */}
        <div
          className="relative bg-zinc-900/30 rounded-lg border border-zinc-700/50 overflow-hidden"
          style={{
            width: GRID_COLS * SLOT_SIZE,
            height: GRID_ROWS * SLOT_SIZE,
          }}
        >
          {/* Фон сетки */}
          <div className="absolute inset-0 grid" style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, ${SLOT_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, ${SLOT_SIZE}px)`,
          }}>
            {gridSlots.map((slot) => (
              <div
                key={slot.id}
                className="border border-zinc-700/30 transition-all hover:border-zinc-600"
              />
            ))}
          </div>

          {/* Предметы */}
          <MotionContainer stagger={0.02}>
            {items.map((item) => {
              const isSelected = selectedItemId === item.id;

              return (
                <motion.div
                  key={item.id}
                  className={clsx(
                    'absolute cursor-pointer rounded border-2 p-1 backdrop-blur-sm',
                    'transition-all duration-200',
                    'flex items-center justify-center overflow-hidden',
                    isSelected ? 'ring-2 ring-blue-400' : '',
                    getRarityStyles(item.rarity || 'common')
                  )}
                  style={{
                    left: SLOT_SIZE,
                    top: SLOT_SIZE,
                    width: (item.stats?.width || 1) * SLOT_SIZE - 2,
                    height: (item.stats?.height || 1) * SLOT_SIZE - 2,
                    zIndex: isSelected ? 100 : 10,
                  }}
                  onClick={() => onItemSelect(item.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {/* Иконка */}
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>

                  {/* Количество */}
                  {item.quantity > 1 && (
                    <div className="absolute bottom-1 right-1 bg-zinc-900/80 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                      {item.quantity}
                    </div>
                  )}

                  {/* Индикатор состояния */}
                  {item.condition !== undefined && item.condition < 100 && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </motion.div>
              );
            })}
          </MotionContainer>
        </div>

        {/* Статус бар */}
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Используется: {items.length} / {maxSlots} слотов
          </div>
          <div className="text-amber-400">
            Вес: {currentWeight.toFixed(1)} / {maxWeight} кг
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}
```

## 🔧 Компонент InventoryContainer.tsx

```typescript
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Package } from 'lucide-react';

import AnimatedCard from '@/shared/components/AnimatedCard';

interface Container {
  id: string;
  label: string;
  icon: React.ReactNode;
  capacity: number;
  used: number;
}

interface InventoryContainerProps {
  containers: Container[];
  activeContainer: string;
  onSelectContainer: (id: string) => void;
}

export default function InventoryContainer({
  containers,
  activeContainer,
  onSelectContainer,
}: InventoryContainerProps) {
  return (
    <AnimatedCard className="bg-zinc-900/50 border-zinc-700">
      <div className="p-4">
        <h4 className="text-sm font-medium text-zinc-100 mb-3">Контейнеры</h4>

        <div className="space-y-2">
          {containers.map((container) => (
            <motion.button
              key={container.id}
              onClick={() => onSelectContainer(container.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                activeContainer === container.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-zinc-600 bg-zinc-800/30 hover:border-zinc-500'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {container.icon}
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">
                      {container.label}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {container.used} / {container.capacity} слотов
                    </div>
                  </div>
                </div>
              </div>

              {/* Прогресс-бар */}
              <div className="mt-2 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(container.used / container.capacity) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </AnimatedCard>
  );
}
```

## 🎨 Поддерживающие компоненты

### AnimatedCard.tsx

```typescript
'use client';

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import clsx from 'clsx';

interface AnimatedCardProps extends MotionProps {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'inventoryItem';
  className?: string;
}

export default function AnimatedCard({
  children,
  variant = 'default',
  className,
  ...motionProps
}: AnimatedCardProps) {
  const variants = {
    default: {},
    glow: {
      boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)',
    },
    inventoryItem: {},
  };

  return (
    <motion.div
      className={clsx('rounded-lg', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
```

### MotionContainer.tsx

```typescript
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MotionContainerProps {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}

export default function MotionContainer({
  children,
  stagger = 0.1,
  className,
}: MotionContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
```

### DetailedTooltip.tsx

```typescript
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DetailedTooltipProps {
  content: React.ReactNode;
  detailedContent?: React.ReactNode;
  children: React.ReactNode;
}

export default function DetailedTooltip({
  content,
  detailedContent,
  children,
}: DetailedTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-2 text-xs whitespace-nowrap shadow-lg">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

## 📦 Интеграция с типами

Добавить в `src/features/inventory/model/types.ts`:

```typescript
export interface ItemState {
  id: string;
  name: string;
  description?: string;
  kind: 'weapon' | 'armor' | 'consumable' | 'misc' | 'quest';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon?: string;
  value?: number;
  quantity: number;
  condition?: number; // 0-100
  stats?: {
    damage?: number;
    defense?: number;
    weight: number;
    width: number;
    height: number;
  };
}

export interface EquipmentSlots {
  helmet?: string | null;
  clothingTop?: string | null;
  armor?: string | null;
  clothingBottom?: string | null;
  primary?: string | null;
  secondary?: string | null;
  backpack?: string | null;
  rig?: string | null;
}
```

