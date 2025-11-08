# 🛡️ Исправление Error Boundary - Решение проблем с картой

## 📋 Описание проблем

### Проблема 1: `deviceId.substring is not a function`
**Ошибка:** `TypeError: deviceId.substring is not a function at useVisibleMapPoints (useMapData.ts:38:38)`

Приложение падало при попытке отобразить карту из-за неправильного использования хука `useDeviceId()`.

### Проблема 2: `[object Object] is not a functionReference`
**Ошибка:** `Error: [object Object] is not a functionReference at getFunctionAddress (paths.ts:43:13)`

Convex `useQuery` не мог работать с mock API объектом, требуя настоящие функциональные ссылки.

## 🔍 Корневая причина

Хук `useDeviceId()` возвращает **объект** с полем `deviceId`, а не строку напрямую:

```typescript
// src/shared/hooks/useDeviceId.ts
export function useDeviceId() {
  const deviceId = useMemo(() => getDeviceId(), [])
  return { deviceId }  // ❌ Возвращается ОБЪЕКТ!
}
```

Но в коде использовалось так, как будто возвращается строка:

```typescript
// ❌ НЕПРАВИЛЬНО
const deviceId = useDeviceId()  // deviceId = { deviceId: "abc123..." }

// Затем при логировании:
deviceId.substring(0, 8)  // ❌ ОШИБКА! Объект не имеет метода substring
```

## ✅ Решения

### 1. Исправление `deviceId` в `MapView.tsx`

**До:**
```typescript
const deviceId = useDeviceId()  // ❌ получаем объект
```

**После:**
```typescript
const { deviceId } = useDeviceId()  // ✅ деструктуризация объекта
```

### 2. Исправление логирования в `useMapData.ts`

**До:**
```typescript
deviceId: deviceId ? `${deviceId.substring(0, 8)}...` : 'нет'  // ❌ падает
```

**После:**
```typescript
deviceId: deviceId ? `${String(deviceId).substring(0, 8)}...` : 'нет'  // ✅ безопасно
```

### 3. Замена `useQuery` на прямые вызовы `convexQueries`

**Проблема:** Convex `useQuery` ожидает настоящие сгенерированные функциональные ссылки из `convex/_generated/api`, а у нас были только mock типы.

**До:**
```typescript
import { useQuery } from 'convex/react'
import { api } from '@/shared/api/convex'

export function useVisibleMapPoints(params) {
  // ❌ api.mapPoints.listVisible - это mock объект, не функция!
  const data = useQuery(api.mapPoints.listVisible as any, queryArgs)
  
  return {
    points: (data?.points || []),
    isLoading: data === undefined,
  }
}
```

**После:**
```typescript
import { useState, useEffect } from 'react'
import { convexQueries } from '@/shared/api/convex'

export function useVisibleMapPoints(params) {
  const [data, setData] = useState(undefined)
  const [isLoading, setIsLoading] = useState(true)
  
  // ✅ Используем прямые async вызовы вместо useQuery
  useEffect(() => {
    let cancelled = false
    
    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await convexQueries.mapPoints.listVisible(queryArgs)
        if (!cancelled) {
          setData(result)
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки точек:', error)
        if (!cancelled) {
          setData({ points: [], timestamp: Date.now(), ttlMs: 0 })
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    
    fetchData()
    return () => { cancelled = true }
  }, [deviceId, userId, bbox, phase, limit])
  
  return {
    points: (data?.points || []),
    isLoading,
  }
}
```

**Почему это работает:**
- `convexQueries` - это промисы, которые возвращают данные
- Используем обычный `useEffect` с async/await
- Добавлен `cancelled` флаг для предотвращения обновлений размонтированных компонентов
- Лучший контроль над состоянием загрузки и ошибками

## 🛡️ Реализованные меры защиты

### 1. Error Boundary компонент

Создан `src/shared/ui/ErrorBoundary.tsx` согласно лучшим практикам React:

```typescript
import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ [ErrorBoundary] Перехвачена ошибка:', error)
    console.error('📋 [ErrorBoundary] Детали:', errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorUI />
    }
    return this.props.children
  }
}
```

**Особенности:**
- ✅ Использует `static getDerivedStateFromError` для обновления состояния
- ✅ `componentDidCatch` для логирования и сайд-эффектов
- ✅ Поддержка кастомного fallback UI
- ✅ Callback `onError` для дополнительной обработки
- ✅ Детали ошибки показываются только в dev режиме

### 2. Защита от ошибок в MapView

Добавлены `try-catch` блоки во всех критических местах:

```typescript
// Инициализация карты
const handleMapLoad = useCallback((loadedMap: mapboxgl.Map) => {
  try {
    if (!loadedMap) {
      console.error('❌ [MapView] Карта не передана')
      return
    }
    // ... инициализация
  } catch (error) {
    console.error('❌ [MapView] Ошибка при инициализации:', error)
  }
}, [])

// Обновление маркеров
useEffect(() => {
  if (!map) return
  
  try {
    for (const point of points) {
      // Проверяем валидность точки
      if (!point || !point.id || !point.coordinates) {
        console.warn('⚠️ [MapView] Невалидная точка:', point)
        continue
      }
      // ... создание/обновление маркеров
    }
  } catch (error) {
    console.error('❌ [MapView] Критическая ошибка:', error)
  }
}, [map, points, selectedPointId, handleSelectPoint])
```

### 3. Интеграция Error Boundary в MapPage

```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    console.error('❌ [MapPage] Ошибка в MapView:', error)
    console.error('📋 [MapPage] Component stack:', errorInfo.componentStack)
  }}
>
  <MapView {...props} />
</ErrorBoundary>
```

## 📊 Результаты

### До исправления:
- ❌ Приложение падало при открытии карты
- ❌ Белый экран без информации об ошибке
- ❌ Нет способа восстановить работу без перезагрузки

### После исправления:
- ✅ Ошибки перехватываются и логируются
- ✅ Показывается красивый UI с сообщением об ошибке
- ✅ Пользователь может попробовать снова или перезагрузить страницу
- ✅ Детальное логирование для отладки
- ✅ Приложение не падает при невалидных данных

## 🎓 Лучшие практики (Context7)

### React Error Boundaries

Согласно официальной документации React:

### 1. Error Boundaries - правильный способ обработки ошибок рендеринга

```javascript
// ❌ НЕПРАВИЛЬНО - try/catch не ловит ошибки рендеринга
function Parent() {
  try {
    return <ChildComponent />
  } catch (error) {
    return <div>Error occurred</div>  // Никогда не сработает!
  }
}

// ✅ ПРАВИЛЬНО - используем Error Boundary
function Parent() {
  return (
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ChildComponent />
    </ErrorBoundary>
  )
}
```

**Почему try/catch не работает?**
- React ошибки не выбрасываются как обычные исключения
- Они всплывают по дереву компонентов
- Только Error Boundary может их перехватить

### 2. Использование `componentDidCatch` для логирования

```javascript
componentDidCatch(error, errorInfo) {
  // errorInfo.componentStack - стек компонентов React
  // error - само исключение
  logErrorToMyService(error, errorInfo.componentStack)
}
```

### 3. `getDerivedStateFromError` для обновления UI

```javascript
static getDerivedStateFromError(error) {
  // Обновляем состояние, чтобы показать fallback UI
  return { hasError: true }
}
```

### 4. Graceful degradation

```typescript
// Проверяем валидность данных
if (!point || !point.id || !point.coordinates) {
  console.warn('⚠️ Невалидная точка:', point)
  continue  // Пропускаем невалидную точку, продолжаем работу
}

// Безопасное размонтирование
try {
  root.unmount()
} catch (e) {
  console.warn('⚠️ Ошибка при размонтировании:', e)
  // Приложение продолжает работать
}
```

## 📝 Логирование

Теперь при ошибке видим:

```
❌ [ErrorBoundary] Перехвачена ошибка: TypeError: deviceId.substring is not a function
📋 [ErrorBoundary] Детали ошибки: {
  componentStack: "at MapView ... at ErrorBoundary ... at MapPage ..."
}
❌ [MapPage] Ошибка в MapView: TypeError: deviceId.substring is not a function
📋 [MapPage] Component stack: [детальный стек]
```

## 🔧 Как использовать

### Error Boundary для любого компонента:

```typescript
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

<ErrorBoundary
  fallback={<YourCustomErrorUI />}  // опционально
  onError={(error, info) => {
    // Ваша кастомная обработка
    reportToAnalytics(error, info)
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### В режиме разработки:
- Показываются детали ошибки и stack trace
- Кнопки "Попробовать снова" и "Перезагрузить страницу"

### В продакшене:
- Показывается только дружелюбное сообщение
- Детали ошибки скрыты
- Логируется на сервер (если настроен `onError`)

### Convex React Integration

Согласно документации Convex:

**✅ ПРАВИЛЬНО - Использование сгенерированного API:**
```typescript
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"  // Сгенерированный API

function MessageList({ channelId }) {
  // useQuery работает с настоящими функциональными ссылками
  const messages = useQuery(api.messages.listMessages, { channelId, limit: 50 })
  
  if (messages === undefined) {
    return <div>Loading...</div>
  }
  
  return <div>{messages.map(msg => <p key={msg._id}>{msg.body}</p>)}</div>
}
```

**❌ НЕПРАВИЛЬНО - Mock объекты не работают:**
```typescript
// Это НЕ работает с useQuery!
const api = {
  messages: {
    listMessages: {
      _type: 'query',
      _args: {},  // Mock объект
    }
  }
}

const messages = useQuery(api.messages.listMessages, args)  // ❌ ОШИБКА!
```

**✅ Альтернатива для dev без Convex бэкенда:**
```typescript
// Используйте async функции вместо useQuery
const convexQueries = {
  messages: {
    listMessages: async (args) => {
      // Mock или реальный API вызов
      return await fetch('/api/messages', { body: JSON.stringify(args) })
    }
  }
}

// В компоненте используйте useEffect
useEffect(() => {
  let cancelled = false
  async function load() {
    const data = await convexQueries.messages.listMessages(args)
    if (!cancelled) setMessages(data)
  }
  load()
  return () => { cancelled = true }
}, [args])
```

## 🎯 Заключение

Проблемы были решены путём:
1. ✅ Правильного использования хука `useDeviceId()` с деструктуризацией
2. ✅ Замены `useQuery` на прямые async вызовы `convexQueries`
3. ✅ Добавления Error Boundary для graceful error handling  
4. ✅ Добавления try-catch блоков в критических местах
5. ✅ Валидации данных перед использованием
6. ✅ Правильного управления состоянием с cleanup при размонтировании
7. ✅ Детального логирования для отладки

**Ключевые уроки:**
- 🔑 Convex `useQuery` требует настоящие сгенерированные функциональные ссылки
- 🔑 Для mock данных используйте обычные async функции с `useEffect`
- 🔑 Всегда проверяйте, что хук возвращает (объект vs значение)
- 🔑 Error Boundary - единственный способ перехватить ошибки рендеринга React
- 🔑 Всегда используйте cleanup функции в `useEffect` для async операций

Теперь приложение устойчиво к ошибкам и предоставляет отличный UX даже при возникновении проблем! 🚀

