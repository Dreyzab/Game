# Детальная UI/UX логика инвентаря: Tarkov, Disco Elysium, Baldur's Gate

> **Реализовано в текущем MVP**
> - Настольная сетка 6×10 + табы для мобилки, поиск/фильтры, тултипы (см. InventoryPage).
> - Drag&drop с визуальными оверлеями, быстрыми слотами и equip-зонами.
> - Keyboard navigation + framer-motion анимации для grid/equipment/quick.
> - Quest-badge UI: защищённые предметы подсвечиваются в Grid и ItemDetails, drop на мусор заблокирован.

## 📱 Мобильная адаптация и жесты

### 1. Тач-события и жесты

```typescript
// src/shared/lib/touchGestures.ts

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

export class TouchGestureHandler {
  private touchState: TouchState | null = null;
  private longPressTimer: NodeJS.Timeout | null = null;
  private readonly LONG_PRESS_DURATION = 500; // мс
  private readonly SWIPE_THRESHOLD = 50; // px
  private readonly LONG_PRESS_THRESHOLD = 10; // px (допуск для движения при долгом нажатии)

  onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    this.touchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
    };

    // Запустить долгое нажатие
    this.longPressTimer = setTimeout(() => {
      if (this.touchState) {
        this.onLongPress?.(touch.clientX, touch.clientY);
      }
    }, this.LONG_PRESS_DURATION);
  }

  onTouchMove(e: React.TouchEvent) {
    if (!this.touchState) return;

    const touch = e.touches[0];
    this.touchState.currentX = touch.clientX;
    this.touchState.currentY = touch.clientY;

    // Если движение превышает порог, отменить долгое нажатие
    const distance = Math.hypot(
      touch.clientX - this.touchState.startX,
      touch.clientY - this.touchState.startY
    );

    if (distance > this.LONG_PRESS_THRESHOLD && this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
      
      // Начать перетаскивание
      if (distance > 20) {
        this.onDragStart?.();
      }
    }

    this.onDragMove?.(touch.clientX, touch.clientY);
  }

  onTouchEnd(e: React.TouchEvent) {
    if (!this.touchState) return;

    clearTimeout(this.longPressTimer!);

    const deltaX = this.touchState.currentX - this.touchState.startX;
    const deltaY = this.touchState.currentY - this.touchState.startY;
    const deltaTime = Date.now() - this.touchState.startTime;

    // Определить тип жеста
    if (Math.abs(deltaX) > this.SWIPE_THRESHOLD && Math.abs(deltaY) < 50 && deltaTime < 300) {
      // Свайп
      this.onSwipe?.(deltaX > 0 ? 'right' : 'left');
    } else if (Math.abs(deltaY) > this.SWIPE_THRESHOLD && Math.abs(deltaX) < 50 && deltaTime < 300) {
      // Вертикальный свайп
      this.onVerticalSwipe?.(deltaY > 0 ? 'down' : 'up');
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      // Обычный тап
      this.onTap?.();
    }

    this.touchState = null;
  }

  // Обработчики (переопределяются родителем)
  onTap?: () => void;
  onLongPress?: (x: number, y: number) => void;
  onSwipe?: (direction: 'left' | 'right') => void;
  onVerticalSwipe?: (direction: 'up' | 'down') => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
}
```

### 2. Мобильный компонент инвентаря (адаптивный)

```typescript
// src/features/inventory/ui/InventoryPageMobile.tsx

'use client';

import React, { useState, useRef } from 'react';
import { useInventoryStore } from '@/shared/stores/inventoryStore';
import { TouchGestureHandler } from '@/shared/lib/touchGestures';
import InventoryGrid from './InventoryGrid';
import EquipmentSlots from './EquipmentSlots';
import QuickAccessBar from './QuickAccessBar';
import DetailedTooltip from './DetailedTooltip';
import clsx from 'clsx';

export default function InventoryPageMobile() {
  const { items, equipment } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<'inventory' | 'equipment'>('inventory');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const gestureHandlerRef = useRef<TouchGestureHandler>(new TouchGestureHandler());

  const handler = gestureHandlerRef.current;

  handler.onSwipe = (direction) => {
    if (direction === 'left') {
      setActiveTab('equipment');
    } else if (direction === 'right') {
      setActiveTab('inventory');
    }
  };

  handler.onTap = () => {
    // Показать/скрыть детали предмета
    if (selectedItemId) {
      setSelectedItemId(null);
    }
  };

  handler.onLongPress = (x, y) => {
    // Долгое нажатие открывает контекстное меню
    console.log('Долгое нажатие на', x, y);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col"
      onTouchStart={(e) => handler.onTouchStart(e)}
      onTouchMove={(e) => handler.onTouchMove(e)}
      onTouchEnd={(e) => handler.onTouchEnd(e)}
    >
      {/* Заголовок */}
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">Инвентарь</h1>
      </div>

      {/* Основной контент (с анимацией при переключении вкладок) */}
      <div className="flex-1 overflow-hidden">
        <div
          className="transition-transform duration-300"
          style={{
            transform: activeTab === 'equipment' ? 'translateX(-100%)' : 'translateX(0)',
          }}
        >
          <div className="w-screen h-full overflow-y-auto p-4">
            <InventoryGrid items={items} />
          </div>

          <div className="w-screen h-full overflow-y-auto p-4">
            <EquipmentSlots equipment={equipment} />
          </div>
        </div>
      </div>

      {/* Вкладки внизу */}
      <div className="border-t border-slate-700 grid grid-cols-2 gap-0 bg-slate-800 sticky bottom-0">
        <button
          className={clsx(
            'py-4 font-semibold transition text-center',
            activeTab === 'inventory'
              ? 'border-b-2 border-amber-600 text-amber-400'
              : 'text-slate-400'
          )}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Инвентарь
        </button>
        <button
          className={clsx(
            'py-4 font-semibold transition text-center',
            activeTab === 'equipment'
              ? 'border-b-2 border-amber-600 text-amber-400'
              : 'text-slate-400'
          )}
          onClick={() => setActiveTab('equipment')}
        >
          🛡️ Экипировка
        </button>
      </div>

      {/* Быстрый доступ (отдельная зона) */}
      <div className="border-t border-slate-700 bg-slate-800/50 p-2">
        <QuickAccessBar quickSlots={equipment.quick} />
      </div>

      {/* Боковая панель с деталями (для больших экранов) */}
      {selectedItemId && items[selectedItemId] && (
        <div className="absolute bottom-24 right-4 z-50 max-w-xs">
          <DetailedTooltip item={items[selectedItemId]} />
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Стилизация согласно Disco Elysium, Tarkov, Baldur's Gate

### 1. Цветовая схема и рарность

```typescript
// src/shared/lib/itemRarityColors.ts

export const RARITY_CONFIG = {
  common: {
    name: 'Обычное',
    colors: {
      border: 'border-gray-400',
      bg: 'bg-gray-500/20',
      text: 'text-gray-300',
      accent: '#a1a1a1',
      hex: '#808080',
    },
    icon: '⚪',
  },
  uncommon: {
    name: 'Необычное',
    colors: {
      border: 'border-green-500',
      bg: 'bg-green-500/20',
      text: 'text-green-300',
      accent: '#4ade80',
      hex: '#22c55e',
    },
    icon: '🟢',
  },
  rare: {
    name: 'Редкое',
    colors: {
      border: 'border-blue-500',
      bg: 'bg-blue-500/20',
      text: 'text-blue-300',
      accent: '#3b82f6',
      hex: '#0ea5e9',
    },
    icon: '🔵',
  },
  epic: {
    name: 'Эпическое',
    colors: {
      border: 'border-purple-500',
      bg: 'bg-purple-500/20',
      text: 'text-purple-300',
      accent: '#a855f7',
      hex: '#8b5cf6',
    },
    icon: '🟣',
  },
  legendary: {
    name: 'Легендарное',
    colors: {
      border: 'border-orange-500',
      bg: 'bg-orange-500/20',
      text: 'text-orange-300',
      accent: '#f97316',
      hex: '#f59e0b',
    },
    icon: '🟠',
  },
};

// Для Disco Elysium - дополнительные атмосферные эффекты
export const ATMOSPHERE_STYLES = {
  discoElysium: {
    font: 'font-serif',
    textShadow: 'text-shadow: 2px 2px 4px rgba(0,0,0,0.5)',
    defaultColor: 'text-yellow-100',
    lowHealthColor: 'text-red-600',
    magicColor: 'text-blue-400',
    thoughtColor: 'text-purple-400',
  },
  tarkov: {
    font: 'font-mono',
    gritty: 'text-slate-200 gritty-texture',
    tactical: 'uppercase tracking-wider',
  },
  baldursGate: {
    font: 'font-serif',
    classic: 'text-amber-200',
    frameStyle: 'border-4 border-amber-800 bg-amber-900/30',
  },
};
```

### 2. Анимация перетаскивания (Framer Motion)

```typescript
// src/features/inventory/ui/AnimatedItemCard.tsx

'use client';

import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';
import clsx from 'clsx';

interface AnimatedItemCardProps {
  item: any;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  rarity: string;
}

export default function AnimatedItemCard({
  item,
  onDragStart,
  onDragEnd,
  isDragging,
  rarity,
}: AnimatedItemCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useTransform([x, y], ([latestX, latestY]) => {
    return isDragging ? 1.1 : 1;
  });

  const rarityColors: Record<string, string> = {
    common: 'border-gray-400',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-orange-500',
  };

  return (
    <motion.div
      drag
      dragElastic={0.2}
      dragTransition={{ power: 0.3, constraint: 'unconstrained' }}
      x={x}
      y={y}
      scale={scale}
      onDragStart={() => {
        onDragStart?.();
      }}
      onDragEnd={() => {
        x.set(0);
        y.set(0);
        onDragEnd?.();
      }}
      className={clsx(
        'relative aspect-square rounded border-4 cursor-grab active:cursor-grabbing',
        'overflow-hidden transition-all duration-200 hover:scale-105',
        rarityColors[rarity] || rarityColors.common,
        isDragging && 'shadow-2xl shadow-yellow-400'
      )}
      whileHover={{ borderColor: '#f59e0b' }}
      whileTap={{ scale: 1.15 }}
    >
      <div className="w-full h-full relative">
        <Image
          src={item.icon}
          alt={item.name}
          fill
          className="object-cover"
          draggable={false}
        />

        {/* Эффект легендарного свечения */}
        {rarity === 'legendary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-yellow-500/30"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Количество */}
        {item.quantity > 1 && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded">
            {item.quantity}
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

---

## 🎮 Drag & Drop с валидацией и коллизиями

### Система сетки Tetris-стиля (как в Tarkov)

```typescript
// src/shared/lib/gridCalculations.ts

export interface GridCell {
  x: number;
  y: number;
}

export interface GridItem {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation?: 0 | 90; // градусы поворота
}

export class GridManager {
  private grid: (string | null)[][];
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = Array(height)
      .fill(null)
      .map(() => Array(width).fill(null));
  }

  /**
   * Проверить, может ли предмет быть размещен в сетке
   */
  canPlace(item: GridItem, x: number, y: number): boolean {
    const { width, height } = this.getItemDimensions(item);

    // Проверить границы
    if (x + width > this.width || y + height > this.height) {
      return false;
    }

    // Проверить коллизии с другими предметами
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        if (this.grid[row][col] !== null) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Разместить предмет в сетке
   */
  place(item: GridItem, x: number, y: number): boolean {
    if (!this.canPlace(item, x, y)) {
      return false;
    }

    const { width, height } = this.getItemDimensions(item);

    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        this.grid[row][col] = item.id;
      }
    }

    return true;
  }

  /**
   * Удалить предмет из сетки
   */
  remove(itemId: string): void {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.grid[row][col] === itemId) {
          this.grid[row][col] = null;
        }
      }
    }
  }

  /**
   * Получить размеры предмета с учетом поворота
   */
  getItemDimensions(item: GridItem): { width: number; height: number } {
    if (item.rotation === 90) {
      return { width: item.height, height: item.width };
    }
    return { width: item.width, height: item.height };
  }

  /**
   * Найти первую свободную позицию для предмета
   */
  findFirstEmptySlot(itemWidth: number, itemHeight: number): GridCell | null {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const item = { id: 'test', width: itemWidth, height: itemHeight };
        if (this.canPlace(item, col, row)) {
          return { x: col, y: row };
        }
      }
    }
    return null;
  }
}
```

### Hook для Drag & Drop логики

```typescript
// src/features/inventory/model/hooks/useDragDrop.ts

'use client';

import { useState, useCallback } from 'react';
import { GridManager } from '@/shared/lib/gridCalculations';

interface DragDropState {
  draggedItemId: string | null;
  dragOffset: { x: number; y: number };
  dropTarget: { x: number; y: number } | null;
  isValid: boolean;
}

export function useDragDrop(gridWidth: number, gridHeight: number) {
  const [state, setState] = useState<DragDropState>({
    draggedItemId: null,
    dragOffset: { x: 0, y: 0 },
    dropTarget: null,
    isValid: false,
  });

  const gridManager = new GridManager(gridWidth, gridHeight);

  const handleDragStart = useCallback((itemId: string, x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      draggedItemId: itemId,
      dragOffset: { x, y },
    }));
  }, []);

  const handleDragMove = useCallback(
    (x: number, y: number) => {
      if (!state.draggedItemId) return;

      const gridX = Math.floor(x / 60); // 60px ячейка
      const gridY = Math.floor(y / 60);

      const isValid = gridManager.canPlace(
        { id: state.draggedItemId, width: 1, height: 1 },
        gridX,
        gridY
      );

      setState((prev) => ({
        ...prev,
        dropTarget: { x: gridX, y: gridY },
        isValid,
      }));
    },
    [state.draggedItemId, gridManager]
  );

  const handleDragEnd = useCallback(() => {
    setState((prev) => ({
      ...prev,
      draggedItemId: null,
      dropTarget: null,
    }));
  }, []);

  return {
    state,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
```

---

## 🔍 Система поиска и фильтрации

```typescript
// src/features/inventory/ui/ItemSearch.tsx (расширенная версия)

'use client';

import React, { useMemo } from 'react';
import { useInventoryStore } from '@/shared/stores/inventoryStore';
import clsx from 'clsx';

const SORT_OPTIONS = [
  { value: 'recent', label: 'По времени', icon: '⏱️' },
  { value: 'name', label: 'По названию', icon: '🔤' },
  { value: 'weight', label: 'По весу', icon: '⚖️' },
  { value: 'rarity', label: 'По редкости', icon: '✨' },
];

export default function ItemSearch() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('recent');
  const { items } = useInventoryStore();

  // Фильтровать и сортировать предметы
  const filteredItems = useMemo(() => {
    let filtered = Object.values(items);

    // Фильтр по типу
    if (activeFilter !== 'all') {
      filtered = filtered.filter((item) => item.kind === activeFilter);
    }

    // Поиск по названию/описанию
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'weight':
          return a.stats.weight - b.stats.weight;
        case 'rarity': {
          const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchQuery, activeFilter, sortBy]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
      {/* Поиск */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Поиск по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-10 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-amber-600 transition"
        />
        <span className="absolute left-3 top-3 text-slate-400">🔍</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Результат поиска */}
      <div className="text-sm text-slate-400">
        Найдено: <span className="text-amber-400 font-bold">{filteredItems.length}</span> предметов
      </div>

      {/* Фильтры и сортировка */}
      <div className="flex gap-2 flex-wrap">
        {/* Сортировка */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white hover:border-amber-600 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>

        {/* Фильтры по типам */}
        <div className="flex flex-wrap gap-2 ml-auto">
          {[
            { value: 'all', label: '📦 Все' },
            { value: 'weapon', label: '🔫 Оружие' },
            { value: 'armor', label: '🛡️ Броня' },
            { value: 'consumable', label: '🧪 Расходники' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={clsx(
                'px-3 py-1 rounded text-sm font-semibold transition',
                activeFilter === filter.value
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## ⌨️ Горячие клавиши и специальные комбинации

```typescript
// src/features/inventory/model/hooks/useKeyboardShortcuts.ts

'use client';

import { useEffect } from 'react';
import { useInventoryStore } from '@/shared/stores/inventoryStore';

export function useKeyboardShortcuts() {
  const { dropItem, sortInventory } = useInventoryStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+I: открыть инвентарь
      if (event.altKey && event.key === 'i') {
        event.preventDefault();
        // Открыть модаль инвентаря
      }

      // F: фильтр
      if (event.key === 'f' && !event.ctrlKey) {
        event.preventDefault();
        // Фокус на поле поиска
      }

      // Ctrl+F: быстрый поиск
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        // Глобальный поиск
      }

      // D: выбросить выбранный предмет
      if (event.key === 'd') {
        event.preventDefault();
        // dropItem(selectedItemId);
      }

      // S: отсортировать по редкости
      if (event.key === 's') {
        event.preventDefault();
        sortInventory('rarity');
      }

      // R: вращение предмета (когда выбран)
      if (event.key === 'r' && !event.ctrlKey) {
        event.preventDefault();
        // rotateSelectedItem();
      }

      // 1-5: быстрый доступ
      if (event.key >= '1' && event.key <= '5') {
        const slotIndex = parseInt(event.key) - 1;
        event.preventDefault();
        // useQuickSlot(slotIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropItem, sortInventory]);
}
```

---

## 📊 Сравнение предметов (для выбора экипировки)

```typescript
// src/features/inventory/ui/ItemComparison.tsx

'use client';

import React from 'react';
import clsx from 'clsx';

interface ComparisonProps {
  currentItem: any;
  newItem: any;
}

export default function ItemComparison({ currentItem, newItem }: ComparisonProps) {
  const stats = ['damage', 'defense', 'weight', 'maxDurability'];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h3 className="text-white font-bold mb-4">Сравнение:</h3>

      <div className="space-y-2">
        {stats.map((stat) => {
          const currentValue = currentItem.stats[stat] || 0;
          const newValue = newItem.stats[stat] || 0;
          const diff = newValue - currentValue;
          const isPositive = diff > 0;

          return (
            <div key={stat} className="flex justify-between text-sm">
              <span className="text-slate-400">{stat}:</span>
              <div className="flex gap-3">
                <span className="text-slate-300 w-12 text-right">{currentValue}</span>
                <span
                  className={clsx(
                    'w-12 text-right font-bold',
                    diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'
                  )}
                >
                  {newValue} {diff !== 0 && `(${diff > 0 ? '+' : ''}${diff})`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 🎬 Анимационные переходы (Framer Motion)

```typescript
// src/features/inventory/ui/InventoryTransitions.tsx

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.15 },
  },
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const pageTransitionVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

// Применение в компоненте
export function AnimatedInventoryContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

## 💾 Автосохранение состояния

```typescript
// src/shared/hooks/useAutoSave.ts

'use client';

import { useEffect, useRef } from 'react';
import { useInventoryStore } from '@/shared/stores/inventoryStore';
import { useInventoryOutbox } from '@/shared/stores/inventoryOutbox';

const AUTOSAVE_INTERVAL = 30000; // 30 сек

export function useAutoSave() {
  const inventory = useInventoryStore();
  const outbox = useInventoryOutbox();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Сохранять каждые 30 сек
    saveTimeoutRef.current = setInterval(async () => {
      if (outbox.outbox.length > 0) {
        // Только если есть unsync события
        const deviceId = localStorage.getItem('deviceId') || 'unknown';
        await outbox.syncNow(deviceId);
      }
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
      }
    };
  }, [outbox]);
}
```
