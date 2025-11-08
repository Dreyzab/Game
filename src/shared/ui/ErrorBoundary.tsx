/**
 * @fileoverview Error Boundary компонент
 * FSD: shared/ui
 * 
 * Перехватывает ошибки React компонентов и показывает fallback UI
 */

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils/cn'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary компонент для перехвата ошибок
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ [ErrorBoundary] Перехвачена ошибка:', error)
    console.error('📋 [ErrorBoundary] Детали ошибки:', errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Вызываем callback если передан
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    console.log('🔄 [ErrorBoundary] Сброс состояния ошибки')
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Если передан кастомный fallback - используем его
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Иначе показываем дефолтный UI
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center min-h-[400px] p-8 bg-red-950 bg-opacity-20 rounded-lg border border-red-900',
            this.props.className
          )}
        >
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Произошла ошибка</h2>
          <p className="text-gray-400 text-center mb-6 max-w-md">
            Что-то пошло не так при загрузке компонента. Попробуйте перезагрузить страницу.
          </p>

          {/* Детали ошибки в режиме разработки */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-6 w-full max-w-2xl">
              <summary className="cursor-pointer text-red-400 font-medium mb-2">
                Показать детали ошибки (только в режиме разработки)
              </summary>
              <div className="bg-gray-900 p-4 rounded border border-gray-700 overflow-auto max-h-60">
                <p className="text-red-400 font-mono text-sm mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-gray-400 text-xs overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

