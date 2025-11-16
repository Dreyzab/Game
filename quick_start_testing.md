# Быстрый старт и тестирование системы инвентаря

## 🚀 Быстрый старт (Hello World для инвентаря)

### Шаг 1: Скопировать базовые файлы

```bash
# Создать структуру
mkdir -p src/entities/item/{model,lib}
mkdir -p src/features/inventory/{ui,model/hooks}
mkdir -p src/shared/{stores,lib}

# Скопировать файлы типов
cp shared/types/item.ts -> использовать из inventory_system.md
```

### Шаг 2: Создать минимальный Zustand store

```typescript
// src/shared/stores/inventoryStore.ts (минимальная версия)

import { create } from 'zustand';

export const useInventoryStore = create((set) => ({
  items: {},
  equipment: { primary: null, secondary: null, helmet: null, armor: null },
  
  addItem: (item) => set((state) => ({
    items: { ...state.items, [item.id]: item }
  })),
  
  equipItem: (itemId, slotId) => set((state) => ({
    equipment: { ...state.equipment, [slotId]: itemId }
  })),
}));
```

### Шаг 3: Создать минимальный компонент

```typescript
// src/features/inventory/ui/InventoryPage.tsx (версия для быстрого старта)

'use client';

import React from 'react';
import { useInventoryStore } from '@/shared/stores/inventoryStore';

export default function InventoryPage() {
  const { items, addItem } = useInventoryStore();

  const handleAddTestItem = () => {
    addItem({
      id: 'sword-1',
      kind: 'weapon',
      name: 'Железный мечEOF',
      description: 'Простой мечEOF',
      icon: '⚔️',
      rarity: 'uncommon',
      stats: { damage: 15, weight: 2.5, width: 1, height: 2 },
      quantity: 1,
    });
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-4">Инвентарь</h1>
      
      <button
        onClick={handleAddTestItem}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded mb-4"
      >
        + Добавить меч
      </button>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(items).map(([id, item]) => (
          <div key={id} className="bg-slate-800 p-4 rounded border border-amber-600">
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="font-bold">{item.name}</h3>
            <p className="text-sm text-slate-400">{item.rarity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Шаг 4: Добавить в маршрут

```typescript
// src/pages/inventory.tsx или src/app/inventory/page.tsx

import InventoryPage from '@/features/inventory/ui/InventoryPage';

export default function Page() {
  return <InventoryPage />;
}
```

---

## 🧪 Примеры тестирования

### Unit тесты для GridManager

```typescript
// src/shared/lib/__tests__/gridCalculations.test.ts

import { describe, it, expect } from 'vitest';
import { GridManager } from '../gridCalculations';

describe('GridManager', () => {
  it('должен разместить предмет в свободной ячейке', () => {
    const grid = new GridManager(10, 6);
    const item = { id: 'item-1', width: 2, height: 2 };

    const canPlace = grid.canPlace(item, 0, 0);
    expect(canPlace).toBe(true);

    grid.place(item, 0, 0);
    const canPlaceAgain = grid.canPlace(item, 0, 0);
    expect(canPlaceAgain).toBe(false);
  });

  it('должен отклонить предмет за границей сетки', () => {
    const grid = new GridManager(10, 6);
    const item = { id: 'item-2', width: 5, height: 2 };

    const canPlace = grid.canPlace(item, 8, 0);
    expect(canPlace).toBe(false); // 8 + 5 > 10
  });

  it('должен вращать предмет', () => {
    const grid = new GridManager(10, 6);
    const item = { id: 'item-3', width: 2, height: 4, rotation: 0 };

    const dims0 = grid.getItemDimensions(item);
    expect(dims0).toEqual({ width: 2, height: 4 });

    item.rotation = 90;
    const dims90 = grid.getItemDimensions(item);
    expect(dims90).toEqual({ width: 4, height: 2 });
  });

  it('должен найти первый пустой слот', () => {
    const grid = new GridManager(10, 6);
    
    const item1 = { id: 'item-1', width: 3, height: 3 };
    grid.place(item1, 0, 0);

    const slot = grid.findFirstEmptySlot(2, 2);
    expect(slot).toEqual({ x: 3, y: 0 });
  });
});
```

### Интеграционные тесты с Zustand

```typescript
// src/shared/stores/__tests__/inventoryStore.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from '../inventoryStore';

describe('InventoryStore', () => {
  beforeEach(() => {
    // Очистить store перед каждым тестом
    useInventoryStore.setState({
      items: {},
      equipment: { primary: null },
    });
  });

  it('должен добавить предмет в инвентарь', () => {
    const { addItem } = useInventoryStore.getState();
    
    const item = {
      id: 'test-1',
      kind: 'weapon',
      name: 'Test Sword',
      description: 'A test sword',
      icon: '⚔️',
      rarity: 'common',
      stats: { damage: 10, weight: 2, width: 1, height: 2 },
      quantity: 1,
    };

    addItem(item);

    const { items } = useInventoryStore.getState();
    expect(items['test-1']).toBeDefined();
    expect(items['test-1'].name).toBe('Test Sword');
  });

  it('должен экипировать предмет', () => {
    const { addItem, equipItem } = useInventoryStore.getState();
    
    const item = {
      id: 'sword-1',
      kind: 'weapon',
      name: 'Iron Sword',
      description: 'Iron sword',
      icon: '⚔️',
      rarity: 'uncommon',
      stats: { damage: 15, weight: 2.5, width: 1, height: 2 },
      quantity: 1,
    };

    addItem(item);
    equipItem('sword-1', 'primary');

    const { equipment } = useInventoryStore.getState();
    expect(equipment.primary).toBeDefined();
  });

  it('должен удалить предмет из инвентаря', () => {
    const { addItem, removeItem } = useInventoryStore.getState();
    
    const item = {
      id: 'potion-1',
      kind: 'consumable',
      name: 'Health Potion',
      description: 'Restores health',
      icon: '🧪',
      rarity: 'common',
      stats: { weight: 0.5, width: 1, height: 1 },
      quantity: 5,
    };

    addItem(item, 5);
    
    let { items } = useInventoryStore.getState();
    expect(items['potion-1'].quantity).toBe(5);

    removeItem('potion-1', 2);
    
    ({ items } = useInventoryStore.getState());
    expect(items['potion-1'].quantity).toBe(3);
  });
});
```

### E2E тесты (Playwright)

```typescript
// tests/e2e/inventory.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Inventory System', () => {
  test('должен открыть экран инвентаря', async ({ page }) => {
    await page.goto('/inventory');
    
    const heading = page.locator('h1');
    await expect(heading).toContainText('Инвентарь');
  });

  test('должен добавить и отобразить предмет', async ({ page }) => {
    await page.goto('/inventory');
    
    // Нажать кнопку добавления
    await page.click('button:has-text("Добавить меч")');
    
    // Проверить, что предмет появился
    const itemCard = page.locator('text=Железный мечEOF');
    await expect(itemCard).toBeVisible();
  });

  test('должен перетащить предмет', async ({ page }) => {
    await page.goto('/inventory');
    
    // Добавить предмет
    await page.click('button:has-text("Добавить меч")');
    
    // Перетащить в слот экипировки
    const itemCard = page.locator('[data-testid="item-sword-1"]');
    const equipSlot = page.locator('[data-testid="slot-primary"]');
    
    await itemCard.dragTo(equipSlot);
    
    // Проверить, что предмет экипирован
    await expect(equipSlot).toContainText('Железный мечEOF');
  });

  test('должен отобразить информацию о предмете', async ({ page }) => {
    await page.goto('/inventory');
    
    // Добавить предмет
    await page.click('button:has-text("Добавить меч")');
    
    // Нажать на предмет
    const itemCard = page.locator('text=Железный мечEOF').first();
    await itemCard.click();
    
    // Проверить, что показана информация
    const details = page.locator('text=Урон:');
    await expect(details).toBeVisible();
  });

  test('должен работать на мобильном устройстве', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/inventory');
    
    // Проверить, что вкладки видны
    const inventoryTab = page.locator('button:has-text("📦 Инвентарь")');
    await expect(inventoryTab).toBeVisible();
    
    // Свайп между вкладками
    await inventoryTab.click();
    const equipmentTab = page.locator('button:has-text("🛡️ Экипировка")');
    await equipmentTab.click();
    
    await expect(page.locator('text=Пусто')).toBeVisible();
  });
});
```

---

## 📊 Профилирование производительности

### React DevTools Profiler

```typescript
// Оборачивать компонент для профилирования
import { Profiler } from 'react';

export default function InventoryPageWithProfiler() {
  const onRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  };

  return (
    <Profiler id="InventoryPage" onRender={onRenderCallback}>
      <InventoryPage />
    </Profiler>
  );
}
```

### Измерение памяти

```typescript
// Добавить в InventoryPage
useEffect(() => {
  if (typeof window !== 'undefined' && performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1048576;
    const total = performance.memory.totalJSHeapSize / 1048576;
    console.log(`Memory: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`);
  }
}, []);
```

---

## 🔍 Debug инструменты

### Zustand DevTools

```typescript
// src/shared/stores/inventoryStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useInventoryStore = create<InventoryStoreState>()(
  devtools(
    (set) => ({
      // ...
    }),
    { name: 'InventoryStore' }
  )
);
```

### Логирование событий Outbox

```typescript
// src/shared/stores/inventoryOutbox.ts

enqueue: (event) => set((state) => {
  const newEvent = {
    ...event,
    seq: state.deviceSeq + 1,
    timestamp: Date.now(),
  };

  console.log(
    `[Outbox] Event #${newEvent.seq}: ${newEvent.type}`,
    newEvent.payload
  );

  return {
    outbox: [...state.outbox, newEvent],
    deviceSeq: state.deviceSeq + 1,
  };
}),
```

---

## 📝 Примеры данных для тестирования

```typescript
// Создать src/lib/testData.ts

export const TEST_ITEMS = [
  {
    id: 'sword-iron',
    kind: 'weapon',
    name: 'Железный мечEOF',
    description: 'Крепкое оружие из обычного железа',
    icon: '⚔️',
    rarity: 'common',
    stats: { damage: 15, weight: 2.5, width: 1, height: 2 },
    quantity: 1,
  },
  {
    id: 'armor-leather',
    kind: 'armor',
    name: 'Кожаная броня',
    description: 'Легкая броня из кожи',
    icon: '🛡️',
    rarity: 'uncommon',
    stats: { defense: 10, weight: 5, width: 2, height: 2 },
    quantity: 1,
  },
  {
    id: 'potion-health',
    kind: 'consumable',
    name: 'Зелье здоровья',
    description: 'Восстанавливает 50 HP',
    icon: '🧪',
    rarity: 'common',
    stats: { weight: 0.5, width: 1, height: 1 },
    quantity: 3,
  },
  {
    id: 'artifact-ring',
    kind: 'artifact',
    name: 'Кольцо маны',
    description: 'Увеличивает максимальную ману на 20%',
    icon: '💍',
    rarity: 'rare',
    stats: { weight: 0.2, width: 1, height: 1 },
    quantity: 1,
  },
];

// Использование
import { TEST_ITEMS } from '@/lib/testData';

export function loadTestInventory() {
  const { addItem } = useInventoryStore();
  TEST_ITEMS.forEach(item => addItem(item));
}
```

---

## 🎯 Сценарии тестирования

### Сценарий 1: Базовый workflow

```
1. Открыть экран инвентаря
2. Добавить несколько предметов
3. Выбрать предмет и просмотреть детали
4. Перетащить предмет в слот экипировки
5. Проверить обновление статистики
6. Выбросить один из предметов
7. Закрыть инвентарь
```

### Сценарий 2: Drag & Drop

```
1. Добавить предмет A и предмет B
2. Перетащить A в другой слот (успех)
3. Попытаться перетащить B поверх A (должно быть отклонено)
4. Перетащить B в пустой слот
5. Вращать B (нажать R)
6. Перетащить B обратно в инвентарь
```

### Сценарий 3: Оффлайн-синхронизация

```
1. Выключить сеть
2. Добавить 3 предмета в инвентарь
3. Экипировать один
4. Включить сеть
5. Проверить, что все изменения синхронизировались
6. Перезагрузить страницу
7. Убедиться, что состояние восстановилось
```

### Сценарий 4: Мобильное устройство

```
1. Открыть на iOS (375x667)
2. Нажать на вкладку "Инвентарь"
3. Добавить предмет
4. Свайп влево (перейти в Экипировку)
5. Долгое нажатие на пустой слот (контекстное меню)
6. Свайп вправо (вернуться в Инвентарь)
7. Проверить адаптивность сетки
```

---

## 💡 Часто встречающиеся ошибки

### Ошибка 1: Предметы не обновляются при изменении

**Причина**: Zustand не отслеживает изменения вложенных объектов

```typescript
// ❌ Плохо
state.items[itemId].quantity = 5; // Не сработает

// ✅ Хорошо
{
  items: {
    ...state.items,
    [itemId]: { ...state.items[itemId], quantity: 5 }
  }
}
```

### Ошибка 2: Бесконечный цикл рендеров

**Причина**: Создание новых объектов при каждом рендере

```typescript
// ❌ Плохо
const items = Object.values(store.items).sort(...); // Новый массив каждый раз

// ✅ Хорошо
const items = useMemo(
  () => Object.values(store.items).sort(...),
  [store.items]
);
```

### Ошибка 3: Drag & Drop не работает на мобильном

**Причина**: Браузерный drag & drop не работает на touch-устройствах

```typescript
// ✅ Решение: использовать touch события
onTouchStart={(e) => handler.onTouchStart(e)}
onTouchMove={(e) => handler.onTouchMove(e)}
onTouchEnd={(e) => handler.onTouchEnd(e)}
```

### Ошибка 4: Состояние теряется при перезагрузке

**Причина**: Zustand store не персистируется

```typescript
// ✅ Решение: добавить middleware persist
import { persist } from 'zustand/middleware';

export const useInventoryStore = create<InventoryStoreState>()(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'inventory-store' }
  )
);
```

---

## 🔗 Связь с другими документами

- **inventory_system.md**: Полная архитектура и типы
- **inventory_ui_ux.md**: UI компоненты и мобильная адаптация
- **integration_checklist.md**: Интеграция и развертывание

