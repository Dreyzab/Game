
    margin-inline: auto;
    gap: 2rem;
  }
}
@media (max-width: 1023px) {
  .panel-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 1.25rem;
  }
}
@media (max-width: 767px) {
  .panel-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Ширины блоков */
.panel-span-12 { grid-column: span 12 / span 12; }
.panel-span-8  { grid-column: span 8 / span 8; }
.panel-span-7  { grid-column: span 7 / span 7; }
.panel-span-6  { grid-column: span 6 / span 6; }
.panel-span-5  { grid-column: span 5 / span 5; }
.panel-span-4  { grid-column: span 4 / span 4; }
.panel-span-3  { grid-column: span 3 / span 3; }
.panel-span-2  { grid-column: span 2 / span 2; }

@media (max-width: 1023px) {
  .panel-span-12,
  .panel-span-8,
  .panel-span-7,
  .panel-span-6,
  .panel-span-5,
  .panel-span-4,
  .panel-span-3,
  .panel-span-2 { grid-column: span 6 / span 6; }
}
@media (max-width: 767px) {
  .panel-span-12,
  .panel-span-8,
  .panel-span-7,
  .panel-span-6,
  .panel-span-5,
  .panel-span-4,
  .panel-span-3,
  .panel-span-2 { grid-column: span 1 / span 1; }
}

/* Стеклянные карточки (по желанию для виджетов) */
.glass-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(18px) saturate(130%);
  transition: border-color 200ms ease, box-shadow 200ms ease, transform 220ms ease;
}
.glass-panel:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}
— Шаг 4. Базовое приложение и роутинг

src/App.tsx (line 1):

import { Routes, Route, Navigate } from "react-router-dom";
import { ModernHomePage } from "./pages/ModernHomePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ModernHomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
src/main.tsx (line 1):

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
— Шаг 5. Заглушки для виджетов

src/widgets/index.ts (line 1):

export function PlayerStatusWidget() {
  return (
    <div className="glass-panel p-4 rounded-xl">
      <h3 className="text-sm uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Статус игрока</h3>
      <div className="text-[var(--color-text-secondary)]">Данные игрока...</div>
    </div>
  );
}
export function QuickActionsWidget() {
  return (
    <div className="glass-panel p-4 rounded-xl">
      <h3 className="text-sm uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Быстрые действия</h3>
      <div className="text-[var(--color-text-secondary)]">Кнопки действий...</div>
    </div>
  );
}
export function ActiveQuestsWidget() {
  return (
    <div className="glass-panel p-4 rounded-xl">
      <h3 className="text-sm uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Активные задания</h3>
      <div className="text-[var(--color-text-secondary)]">Список квестов...</div>
    </div>
  );
}
export function SystemStatusWidget() {
  return (
    <div className="glass-panel p-4 rounded-xl">
      <h3 className="text-sm uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Система</h3>
      <div className="text-[var(--color-text-secondary)]">Статусы, версии, сервисы...</div>
    </div>
  );
}
— Шаг 6. Страница ModernHomePage

src/pages/ModernHomePage.tsx (line 1):

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { PlayerStatusWidget, QuickActionsWidget, ActiveQuestsWidget, SystemStatusWidget } from "../widgets";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-10 text-[var(--color-text-muted)]">
      <Loader2 className="mr-3 h-5 w-5 animate-spin text-[var(--color-cyan)]" />
      <span className="font-mono text-xs uppercase tracking-[0.32em]">Загрузка…</span>
    </div>
  );
}

export function ModernHomePage() {
  const navigate = useNavigate();
  const [isSignedIn] = useState(false); // заглушка авторизации
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    // Аналитика/логирование при первом рендере (заглушка)
    // console.info("[ModernHomePage] viewed");
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Доброе утро";
    if (hour < 17) return "Добрый день";
    return "Добрый вечер";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] px-4 pb-16 pt-8">
      {/* Фоновые свечения */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.28),transparent_60%)] blur-3xl" />
        <div className="absolute -right-10 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.22),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.18),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Хедер */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="badge-glow mx-auto mb-3 text-[var(--color-bg)]">
            Система QR-Boost
          </div>
          <h1 className="text-5xl font-bold text-[var(--color-text-primary)]">QR-Boost</h1>
          <p className="mt-4 text-sm uppercase tracking-[0.35em] text-[var(--color-text-muted)]">
            {getGreeting()}, сталкер!
          </p>
        </motion.div>

        {/* Сетка виджетов */}
        <Suspense fallback={<LoadingSpinner />}>
          <div className="panel-grid mb-10">
            <div className="panel-span-7">
              <PlayerStatusWidget />
            </div>
            <div className="panel-span-5">
              <QuickActionsWidget />
            </div>
          </div>

          <div className="panel-grid">
            <div className="panel-span-7">
              <ActiveQuestsWidget />
            </div>
            <div className="panel-span-5">
              <SystemStatusWidget />
            </div>
          </div>
        </Suspense>

        {/* Блок для неавторизованных (CTA) */}
        {!isSignedIn && (
          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="button"
              onClick={() => navigate("/prologue")}
              className="inline-flex items-center gap-3 rounded-full border bg-[var(--color-surface-elevated)] px-6 py-3 text-xs uppercase tracking-[0.32em] text-[var(--color-text-primary)] transition hover:text-[var(--color-cyan)]"
              style={{ borderColor: "var(--color-border-strong)" }}
            >
              <span className="h-2 w-2 rounded-full bg-[var(--color-cyan)]" />
              Начать игру
            </button>

            <div className="mt-4" />
            <button
              type="button"
              onClick={async () => {
                setIsCreating(true);
                setCreateMsg(null);
                try {
                  await new Promise((r) => setTimeout(r, 800)); // имитация запроса
                  setCreateMsg("Игрок создан.");
                } catch {
                  setCreateMsg("Не удалось создать игрока.");
                } finally {
                  setIsCreating(false);
                  setTimeout(() => setCreateMsg(null), 4000);
                }
              }}
              disabled={isCreating}
              className={`inline-flex items-center gap-3 rounded-full border bg-[var(--color-surface-elevated)] px-6 py-3 text-xs uppercase tracking-[0.32em] text-[var(--color-text-primary)] transition mr-3 ${isCreating ? "opacity-60 cursor-not-allowed" : "hover:text-[var(--color-cyan)]"}`}
              style={{ borderColor: "var(--color-border-strong)" }}
            >
              <span className="h-2 w-2 rounded-full bg-[var(--color-cyan)]" />
              {isCreating ? "Создаём…" : "Создать игрока"}
            </button>

            {createMsg && (
              <div className="mt-2 text-xs text-[var(--color-text-secondary)]">{createMsg}</div>
            )}

            <button
              type="button"
              onClick={() => console.log("Register admin (dev)")}
              className="inline-flex items-center gap-3 rounded-full border bg-[var(--color-surface-elevated)] px-6 py-3 text-xs uppercase tracking-[0.32em] text-[var(--color-text-primary)] transition hover:text-[var(--color-cyan)]"
              style={{ borderColor: "var(--color-border-strong)" }}
            >
              <span className="h-2 w-2 rounded-full bg-[var(--color-cyan)]" />
              Войти как Admin (dev)
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ModernHomePage;

 идентичные шрифты — подключите Space Grotesk и IBM Plex Mono через <link> в index.html или @import в index.css.