# Visual Novel Engine System Documentation

Это техническое руководство описывает архитектуру, структуры данных и алгоритмы движка визуальной новеллы (VN) проекта Grezwanderer3. Документ предназначен для разработчиков, желающих воссоздать или перенести эту систему в новый проект.

## 1. Архитектурный Обзор

Система VN построена по архитектуре **MVVM (Model-View-ViewModel)** с чётким разделением между данными сценариев, логикой их обработки и состоянием сессии.

### Ключевые компоненты:

1.  **Scenarios (Data Layer)**: "Сырые" данные сцен, написанные в упрощённом формате для удобства сценаристов.
2.  **Scene Pipeline (Logic Layer)**:
    -   **Registry**: Центральное хранилище, управляющее пространствами имен (главами).
    -   **Converter**: Транспайлер, превращающий "сырые" сцены в оптимизированный для рантайма формат (связный список строк).
3.  **Runtime State (Model)**:
    -   **SessionStore**: Глобальное состояние (Zustand) текущей сессии (флаги, накопленный опыт, история выборов).
4.  **ViewModel (Controller)**: React-хук, управляющий навигацией по сценам, валидацией условий и применением эффектов.

---

## 2. Структуры Данных

### 2.1. Raw Data (Исходный формат)
Формат, в котором пишутся сценарии (`src/entities/visual-novel/model/types.ts`).

```typescript
// Сцена глазами сценариста
export interface Scene {
  id: string              // Локальный ID (без префикса главы)
  background: string      // Путь к ассету
  music?: string
  layout?: 'left' | 'right' | 'center' // Позиционирование по умолчанию
  characters: SceneCharacter[]
  dialogue: SceneDialogue[]
  choices?: SceneChoice[] // Выборы в конце сцены
  nextScene?: string      // Линейный переход, если нет выборов
  isTerminal?: boolean    // Маркер конца ветки
}

export interface SceneDialogue {
  speaker: string         // Имя или ID персонажа
  text: string
  emotion?: { primary: string }
  condition?: {           // Условие отображения реплики
    flag?: string
    notFlag?: string
  }
}

export interface SceneChoice {
  id: string
  text: string
  nextScene?: string      // ID следующей сцены
  availability?: {        // Условия доступности
    skillCheck?: {
      skill: string
      difficulty: number // 0-100
      successText?: string
      failureText?: string
    }
    condition?: {
      flag?: string
      notFlag?: string
    }
  }
  effects?: {             // Эффекты выбора
    addFlags?: string[]
    removeFlags?: string[]
    xp?: number
    immediate?: Array<{ type: string, data: any }> // Мгновенные эффекты (HP, UI)
    onSuccess?: BranchEffects // Только для SkillCheck
    onFailure?: BranchEffects
  }
}
```

### 2.2. Runtime Data (Формат исполнения)
Формат, в который `convertScene` преобразует данные. Диалоги превращаются в связный список строк (`VisualNovelLine`), где каждая строка знает о следующей.

```typescript
// Сцена глазами движка
export interface VisualNovelSceneDefinition {
  id: string              // FQN (Fully Qualified Name): "chapter:scene_id"
  entryLineId: string     // ID первой строки диалога
  lines: VisualNovelLine[] // Плоский список всех реплик
  characters: VisualNovelCharacter[] // Нормализованные персонажи
  // ...остальные поля нормализованы
}

export interface VisualNovelLine {
  id: string              // Уникальный ID: "chapter:scene:line_index"
  text: string
  speakerId?: string
  nextLineId?: string     // Указатель на следующую реплику
  choices?: VisualNovelChoice[] // Прикрепляются к последней реплике
  transition?: {          // Переход в другую сцену
    nextSceneId?: string
  }
}
```

### 2.3. Session State (Состояние сессии)
Хранится в `useVisualNovelSessionStore` (Zustand).

```typescript
export interface VisualNovelSessionState {
  rootSceneId: string | null // С чего началась сессия
  visitedScenes: string[]    // История посещений
  
  // Накопленные изменения (commit-buffer pattern)
  // Применяются к глобальному состоянию игры только при завершении сессии
  pendingAddFlags: string[]
  pendingRemoveFlags: string[]
  pendingXp: number
  pendingItems: Array<{ itemId: string, quantity: number }>
  pendingReputation: Record<string, number>
  
  // Лог выборов для аналитики или replay
  choices: Array<{
    sceneId: string,
    choiceId: string,
    timestamp: number
  }>
}
```

---

## 3. Алгоритмы и Логика

### 3.1. Scene Converter & Normalization
**Файл**: `src/entities/visual-novel/model/sceneConverter.ts`

Этот модуль отвечает за подготовку данных перед попаданием в Registry.

1.  **FQN Generation**: ID сцены преобразуется в формат `ChapterID:SceneID`.
2.  **Line Linking**: Массив `dialogue` преобразуется в связный список. Каждая строка получает ссылку `nextLineId` на следующую. Последняя строка получает либо `choices`, либо `transition`.
3.  **Character Resolution**:
    *   Если `speaker` совпадает с известным ID (например, 'bruno'), используется этот ID.
    *   Если это новое имя, генерируется `auto_id` и цвет назначается детерминировано (хэш от имени).
4.  **Asset Normalization**: Пути к картинкам приводятся к абсолютному виду (добавляется `/` в начале, убирается `public/`).

### 3.2. Registry & Navigation Resolution
**Файл**: `src/entities/visual-novel/model/sceneRegistry.ts`

Система реестра решает проблему уникальности ID и поиска сцен.

*   **Registration**: Сценарии регистрируются пачками (главами).
*   **Resolver (`resolveNavigation`)**:
    1.  **Explicit**: Если ID содержит двоеточие (`chapter:scene`), ищем точно.
    2.  **Local**: Ищем ID внутри текущей главы.
    3.  **Global**: Ищем ID во всем реестре (ошибка, если ID есть в нескольких главах).
    4.  **Terminals**: Ключевое слово `'END'` или `'EXIT'` завершает сессию.

### 3.3. ViewModel Logic (State Machine)
**Файл**: `src/features/visual-novel/model/useVisualNovelViewModel.ts`

Основной "мозг" VN на клиенте.

1.  **Initialization**: Загружает сцену по ID. Если не найдена — Fallback на дефолтную (пролог).
2.  **Line Advancement (`advanceToLine`)**:
    *   Проверяет условия (`condition`) следующей строки.
    *   Если условия не выполнены (например, нет флага), ищет следующую строку *после* неё рекурсивно (`getNextSequentialLine`).
    *   Если строк больше нет — сцена считается завершенной (`isSceneCompleted`).
3.  **Choices (`buildChoiceViews`)**:
    *   Блокирует или скрывает выборы на основе флагов (`availability`).
    *   Визуально помечает уже выбранные варианты (`visited_any`).
4.  **Execution (`choose`)**:
    *   **Skill Checks**: Если есть проверка навыка, бросается кубик (виртуально или явно).
        *   Успех -> Применяются `successEffects`, переход в `successNextSceneId`.
        *   Провал -> Применяются `failureEffects`, переход в `failureNextSceneId`.
    *   **Effect Commit**: Вызывает `sessionStore.recordChoice` для записи изменений в буфер.
    *   **Navigation**: Вызывает `goToScene` для перехода.

---

## 4. Пайплайн воссоздания (Step-by-Step)

Чтобы воссоздать эту систему в новом проекте, следуйте этому порядку:

1.  **Копирование Types**:
    *   Перенесите `src/shared/types/visualNovel.ts` (Core types).
    *   Перенесите `src/entities/visual-novel/model/types.ts` (Raw types).

2.  **Реализация Model (Logic)**:
    *   Создайте `sceneRegistry.ts` (Синглтон реестра).
    *   Создайте `sceneConverter.ts` (Функция трансформации).
    *   Создайте `scenes.ts` (Точка входа, инициализирующая реестр).

3.  **Реализация Scenarios**:
    *   Создайте структуру папок для сценариев (`scenarios/prolog/`, `scenarios/chapter1/`).
    *   Напишите сценарии в формате `Scene` (см. пункт 2.1).

4.  **Реализация Session Store**:
    *   Создайте Store (можно использовать Zustand или Redux), реализующий `VisualNovelSessionState`.
    *   Важно: Реализуйте "транзакционность" — эффекты не применяются к герою мгновенно, а копятся в `pending...` массивах.

5.  **Реализация ViewModel**:
    *   Напишите хук `useVisualNovelViewModel`, который связывает текущую сцену, реестр и стор.
    *   Реализуйте логику "пропуска" строк, которые не проходят по условиям (`condition`).

6.  **UI Components (View)**:
    *   Создайте компоненты для отображения фона, спрайтов, диалогового окна и кнопок выбора.
    *   Подключите их к ViewModel.

## 5. Файловая карта проекта (Reference)

```text
src/
├── shared/
│   └── types/
│       └── visualNovel.ts        # Типы для Runtime (Engine)
├── entities/
│   └── visual-novel/
│       ├── model/
│       │   ├── types.ts          # Типы для Scenarios (Writer)
│       │   ├── sceneConverter.ts # Raw -> Runtime
│       │   ├── sceneRegistry.ts  # Namespace management
│       │   └── scenes.ts         # Global accessors & resolving
│       └── scenarios/            # Контент
│           ├── index.ts          # Агрегатор глав
│           └── prolog/           # Пример главы
├── features/
│   └── visual-novel/
│       └── model/
│           ├── useVisualNovelSessionStore.ts # State
│           └── useVisualNovelViewModel.ts    # Logic Hook
```
