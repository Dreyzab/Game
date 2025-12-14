# 🎮 Grenzwanderer3

**Post-apocalyptic location-based RPG** with interactive QR codes, combining visual novel elements, card battles, and real-world exploration.

## ✨ Features

- 🗺️ **Location-based gameplay** - Real world exploration via QR codes
- 🎴 **Card battle system** - Strategic combat mechanics
- 📖 **Visual novel elements** - Immersive storytelling
- 🔄 **Bun + Elysia backend** - Realtime-ready API (HTTP + WS)
- 🎨 **Cyberpunk UI** - Modern design with Tailwind CSS
- 📱 **Mobile-first** - Responsive design for all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Bun (backend)
- npm (frontend)
- Docker (для локальной БД Postgres)

### Шаги запуска

```bash
# 1) Установить зависимости (выполнится автоматически при первом запуске)
# 2) Запустить backend + frontend в dev-режиме
bash start.sh
```

Скрипт поднимет:
- Backend (Bun) на `http://localhost:3000`
- Frontend (Vite) на `http://localhost:5173`
Зависимости `npm` и `bun` ставятся автоматически, если каталоги `node_modules` отсутствуют. Для кастомного Postgres укажите `DATABASE_URL` в `server/.env` (скопируйте `server/.env.example` → `server/.env`) перед запуском.

### Scripts (frontend)

```bash
npm run dev       # Vite dev сервер
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
```

### Scripts (backend)

```bash
bun run dev       # Elysia HTTP+WS сервер на Bun
bun run db:push   # Применить схему в БД (Drizzle)
bun run db:seed   # Засеять точки карты и шаблоны предметов
```

## 🏗️ Architecture

### **FSD (Feature-Sliced Design)**

```text
src/
├── app/                    # App-wide logic
├── entities/              # Business entities (player, quest, map-point)
├── features/              # Business features (auth, map, settings)
├── pages/                 # Page components with FSD structure
├── shared/                # Shared code (UI, API, hooks, lib)
└── widgets/               # Composite UI components
```

### **UI Component Library**

- **Button** - Enhanced with variants, uppercase, tracking
- **Badge** - Glow, solid, outline variants
- **LoadingSpinner** - Configurable sizes and text
- **BackgroundEffects** - Animated gradient backgrounds
- **Heading/Text** - Typography components
- **MotionContainer** - Optimized animations
- **And more...**

## 🛠️ Tech Stack

### **Frontend**

- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS v4** - Utility-first CSS framework
- **Framer Motion** - Smooth animations

### **Backend & Data**

- **Bun + Elysia** - HTTP/WS сервер
- **Drizzle ORM + Postgres** - Схема и миграции
- **Clerk** - Аутентификация
- **Zustand** - Lightweight state management
- **React Router v7** - Modern routing

### **Development**

- **ESLint** - Code quality and consistency
- **TypeScript Compiler** - Strict type checking
- **Path Mapping** - Clean `@/` imports

## 📋 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Production build with optimization
npm run preview      # Preview production build locally
npm run lint         # Run ESLint for code quality checks
```

## React Strict Mode

React 19 runs components twice in development when `StrictMode` is enabled, which caused duplicate visual-novel lines and repeated map/geolocation requests. Strict mode is now behind the `VITE_ENABLE_STRICT_MODE` flag (default `false`) so local side effects stay single-run. Set `VITE_ENABLE_STRICT_MODE=true` in `.env.local` and restart Vite if you still want those extra checks.

## 🎯 Development Status

### ✅ **Completed**

- **FSD Architecture** - Feature-Sliced Design implementation
- **Component Library** - 9 reusable UI components
- **HomePage Refactoring** - Clean, maintainable code structure
- **TypeScript Setup** - Full type safety with strict mode
- **Path Aliases** - Clean import statements with `@/` prefix

### 🚧 **In Progress**

- **Game Logic** - Core gameplay mechanics
- **QR Code System** - Location-based interactions
- **Character System** - Player progression and stats
- **Quest System** - Dynamic storyline management

### 📋 **Planned**

- **Multiplayer Features** - Real-time player interactions
- **Mobile App** - React Native companion
- **Content Management** - Dynamic quest and location creation
- **Analytics Integration** - Player behavior insights

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Grenzwanderer** - The original game concept
- **React & TypeScript** communities
- **Open source contributors**

---

## Built with ❤️ using React, TypeScript & Vite
