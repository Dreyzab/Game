import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { cn } from './shared/lib/utils/cn'
import { Button, AnimatedCard, MotionContainer, Navbar } from './shared/ui/components'

function App() {
  const [count, setCount] = useState(0)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-color-scheme', newTheme)
  }

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4")}>
      <Navbar
        brand={{ name: "Grenzwanderer", logo: "🎮" }}
        variant="glass"
      />

      <MotionContainer className="max-w-md mx-auto" stagger={0.1}>
        <AnimatedCard variant="interactive">
          <div className={cn("p-8")}>
            {/* Theme Toggle */}
            <div className={cn("flex justify-end mb-6")}>
              <Button
                onClick={toggleTheme}
                variant="secondary"
                size="sm"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </Button>
            </div>

            <div className={cn("flex justify-center space-x-4 mb-8")}>
              <a
                href="https://vite.dev"
                target="_blank"
                className={cn("hover:opacity-75 transition-opacity")}
              >
                <img src={viteLogo} className={cn("h-16 w-16")} alt="Vite logo" />
              </a>
              <a
                href="https://react.dev"
                target="_blank"
                className={cn("hover:opacity-75 transition-opacity")}
              >
                <img src={reactLogo} className={cn("h-16 w-16")} alt="React logo" />
              </a>
            </div>

            <h1 className={cn("text-3xl font-bold text-center mb-8")}>
              Grenzwanderer UI Demo
            </h1>

            <div className={cn("text-center space-y-4")}>
              <Button
                onClick={() => setCount((count) => count + 1)}
                variant="primary"
                size="lg"
                leftIcon={<span>🎯</span>}
                className={count > 5 ? "animate-pulse" : ""}
              >
                Count: {count}
              </Button>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm">Outline</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="danger" size="sm">Danger</Button>
              </div>

              <p className={cn("text-sm opacity-75")}>
                Edit <code className={cn("bg-secondary px-2 py-1 rounded text-sm")}>src/App.tsx</code> and save to test HMR
              </p>
            </div>

            <p className={cn("text-center text-sm opacity-75 mt-4")}>
              Built with React, TypeScript & Tailwind CSS
            </p>
          </div>
        </AnimatedCard>
      </MotionContainer>
    </div>
  )
}

export default App
