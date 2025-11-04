# Game Design Document (GDD) - Grenzwanderer

## 🎮 Обзор игры

**Grenzwanderer** — это постапокалиптическая location-based RPG, сочетающая в себе элементы визуальной новеллы, карточных боёв и исследования реального мира через QR-коды. Действие происходит в разрушенном Фрайбурге, где игрок должен выживать, выполнять квесты, развивать репутацию и принимать моральные решения, влияющие на сюжет.

## 🏗️ Техническая архитектура

### **Core Technology Stack**

#### Frontend Architecture
- **React 19.2** + **TypeScript** + **Vite 7.1** — современная SPA платформа
- **Tailwind CSS v4.1** — утилитарный фреймворк для стилизации
- **Framer Motion** — анимации и переходы
- **Lucide React** — иконки
- **Mapbox GL JS** — интерактивные карты
- **Clerk** — аутентификация пользователей
- **Convex** — realtime backend и база данных
- **Zustand** — state management
- **React Router v7** — навигация

#### UI/UX Design System

##### **Архитектура компонентов (Atomic Design)**
```
src/shared/ui/
├── styles/           # Модульные стили
│   ├── variables.css    # CSS custom properties & дизайн-токены
│   ├── base.css         # HTML элементы, типографика, формы
│   ├── components.css   # Компонентные стили (buttons, cards, modals)
│   └── utilities.css    # Утилитарные классы & игровая специфика
└── components/       # React UI компоненты
    ├── Button/          # Многофункциональный кнопочный компонент
    ├── AnimatedCard/    # Анимированная карточка с Framer Motion
    ├── MotionContainer/ # Контейнер для stagger анимаций
    ├── Navbar/          # Адаптивная навигационная панель
    └── index.ts         # Экспорт всех компонентов
```

##### **Дизайн-токены**
- **Цветовая палитра:** 16 базовых цветов + RGB версии для opacity
- **Типографика:** FK Grotesk Neue, Geist, Inter (fallback)
- **Пространство:** 8-ступенчатая шкала (2px - 32px)
- **Радиусы:** 6px - 9999px (full)
- **Тени:** 5 уровней сложности
- **Анимации:** 150ms - 500ms durations

##### **Тематическая система**
- **Тёмная тема по умолчанию** (cyberpunk aesthetic)
- **Светлая тема** как альтернатива
- **Автоматическое переключение:** `@media (prefers-color-scheme)`
- **Принудительное переключение:** `data-color-scheme` attribute
- **Адаптивность:** Mobile-first подход

##### **UI Компоненты (FSD подход)**
- **Button**: React обертка над CSS классами `.btn*`, добавляет типизацию, состояния loading/disabled и поддержку иконок
- **AnimatedCard**: React компонент с Framer Motion анимациями, использует CSS классы `.glass-panel`
- **MotionContainer**: Контейнер для stagger анимаций с направлениями (up, down, left, right, fade)
- **Navbar**: Адаптивная навигационная панель с мобильным меню, поддержкой брендинга и кастомных элементов

##### **Архитектурный принцип**
```
CSS Classes (components.css) ← React Components (components/)
     ↓                              ↓
  Base styles → TypeScript → Logic & Events
```
- **CSS-first**: Стили определены в `components.css` как единый источник
- **React enhancement**: Компоненты добавляют типизацию и интерактивность
- **No duplication**: Один CSS класс = один способ стилизации

#### Backend & Data Layer
- **Convex** — serverless backend с realtime subscriptions
- **TypeScript** — типобезопасность на всех уровнях
- **Zustand stores** — клиентский state management

#### Development Tools
- **ESLint** — линтинг и code quality
- **PostCSS** — CSS processing с Autoprefixer
- **Vite Dev Server** — hot reload и оптимизация
- **TypeScript Compiler** — строгая типизация

#### Utility Libraries
- **clsx + tailwind-merge** — интеллектуальное объединение CSS классов
- **Custom `cn()` function** — стандартная утилита для компонентов

### **Project Structure (FSD Architecture)**

```
src/
├── app/                    # App-wide logic
│   ├── auth/              # Authentication flows
│   └── providers/         # React context providers
├── entities/              # Business entities
│   ├── map-point/         # Location entities
│   ├── player/            # Player data
│   └── quest/             # Quest system
├── features/              # User features
│   ├── map/               # Map interaction
│   └── settings/          # User preferences
├── pages/                 # Page components
├── processes/             # Business processes
├── shared/                # Shared code
│   ├── api/               # API clients
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities & helpers
│   │   └── utils/         # Utility functions
│   │       └── cn.ts      # CSS class merger utility
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript definitions
│   └── ui/                # UI primitives & styles
│       ├── components/    # React UI components
│       │   ├── Button/    # Button component
│       │   ├── AnimatedCard/ # Animated card component
│       │   ├── MotionContainer/ # Animation container
│       │   ├── Navbar/    # Navigation component
│       │   └── index.ts   # Component exports
│       └── styles/        # Modular CSS architecture
└── widgets/               # Composite UI components
```

### **Performance Optimizations**

#### CSS Architecture
- **Модульная структура** — разделение на логические блоки
- **CSS Variables** — динамическое переключение тем
- **GPU-ускорение** — `transform3d`, `will-change`
- **Tree-shaking** — удаление неиспользуемых стилей
- **Critical CSS** — оптимизация загрузки

#### React Optimizations
- **React 19.2** — Concurrent Features & Automatic Batching
- **Code splitting** — lazy loading компонентов
- **Memoization** — React.memo, useMemo, useCallback
- **Virtual scrolling** — для больших списков

#### Bundle Optimization
- **Vite build** — tree-shaking и minification
- **Asset optimization** — WebP, AVIF для изображений
- **Service Worker** — кэширование ресурсов

### **Quality Assurance**

#### Code Quality
- **TypeScript strict mode** — zero runtime errors
- **ESLint rules** — consistent code style
- **Pre-commit hooks** — automated linting

#### Testing Strategy
- **Unit tests** — Jest + React Testing Library
- **Integration tests** — компонентное взаимодействие
- **E2E tests** — Playwright для critical flows

#### Accessibility
- **WCAG 2.1 AA** compliance
- **Screen reader support** — ARIA labels
- **Keyboard navigation** — focus management
- **Color contrast** — 4.5:1 minimum ratio

### **Deployment & DevOps**

#### Build Pipeline
- **Vite production build** — optimized bundles
- **Asset optimization** — compression & caching
- **CDN integration** — static assets delivery

#### Hosting Strategy
- **Vercel/Netlify** — serverless deployment
- **Convex hosting** — backend as service
- **Global CDN** — low latency worldwide

### **Development Workflow**

#### Local Development
```bash
npm run dev          # Hot reload dev server
npm run build        # Production build
npm run lint         # Code linting
npm run preview      # Production preview
```

#### Git Strategy
- **Feature branches** — isolated development
- **Pull requests** — code review process
- **Semantic versioning** — automated releases

### **Risks & Mitigations**

#### Technical Risks
- **React 19 adoption** — thorough testing of new features
- **Tailwind v4 migration** — gradual rollout with fallbacks
- **Mobile performance** — continuous monitoring & optimization

#### Performance Risks
- **Bundle size** — code splitting & lazy loading
- **Memory leaks** — proper cleanup in effects
- **Slow renders** — React DevTools profiling

#### User Experience Risks
- **Accessibility issues** — automated testing & user feedback
- **Mobile usability** — device testing across platforms
- **Loading performance** — Core Web Vitals monitoring