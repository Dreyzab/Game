import React, { useEffect, useMemo, useState } from 'react'
import { SignInButton, useAuth, useUser } from '@clerk/clerk-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { Button } from '@/shared/ui/components/Button'
import { useMyPlayer } from '@/shared/hooks/useMyPlayer'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { authenticatedClient } from '@/shared/api/client'
import { Routes } from '@/shared/lib/utils/navigation'

type RegistrationMethod = 'clerk' | 'password'

const normalizeMethod = (value: string | null): RegistrationMethod | null => {
  if (value === 'clerk' || value === 'password') return value
  return null
}

const safeSceneId = (value: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^[a-z0-9_-]+$/i.test(trimmed)) return null
  if (trimmed.length > 128) return null
  return trimmed
}

const MIN_PASSWORD_LENGTH = 8

const CityRegistrationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { deviceId } = useDeviceId()
  const { data: playerData, isLoading: isPlayerLoading } = useMyPlayer()

  const method = useMemo<RegistrationMethod>(() => {
    const fromQuery = normalizeMethod(searchParams.get('method'))
    return fromQuery ?? 'password'
  }, [searchParams])

  const returnSceneId = useMemo(() => safeSceneId(searchParams.get('returnScene')), [searchParams])

  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)

  useEffect(() => {
    const currentName = (playerData as any)?.player?.name
    if (typeof currentName === 'string' && currentName.trim().length > 0) {
      setNickname(currentName)
    }
  }, [playerData])

  const setMethod = (next: RegistrationMethod) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('method', next)
    setSearchParams(nextParams, { replace: true })
  }

  const submit = async () => {
    setFormError(null)

    const trimmedName = nickname.trim()
    if (!trimmedName) {
      setFormError('Введите никнейм')
      return
    }

    if (trimmedName.length > 32) {
      setFormError('Никнейм слишком длинный (макс. 32 символа)')
      return
    }

    if (method === 'clerk' && !isSignedIn) {
      setFormError('Сначала войдите через Clerk')
      return
    }

    if (method === 'password') {
      const trimmedPassword = password.trim()
      const trimmedConfirm = passwordConfirm.trim()

      if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
        setFormError(`Пароль слишком короткий (мин. ${MIN_PASSWORD_LENGTH} символов)`)
        return
      }

      if (trimmedPassword !== trimmedConfirm) {
        setFormError('Пароли не совпадают')
        return
      }
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)

      const payload: any = {
        method,
        nickname: trimmedName,
        returnScene: returnSceneId ?? undefined,
      }

      if (method === 'password') {
        payload.password = password.trim()
      }

      const { data, error } = await client.player['city-registration'].post(payload)
      if (error) throw error

      const res = data as any
      if (!res?.success) {
        setFormError(typeof res?.error === 'string' ? res.error : 'Не удалось завершить регистрацию')
        return
      }

      await queryClient.invalidateQueries({ queryKey: ['vn-state'] })
      await queryClient.invalidateQueries({ queryKey: ['mapPoints'] })
      await queryClient.invalidateQueries({ queryKey: ['myPlayer'] })

      if (returnSceneId) {
        navigate(`${Routes.VISUAL_NOVEL}/${returnSceneId}`)
        return
      }

      navigate(Routes.MAP)
    } catch (err) {
      console.error('[CityRegistration] Failed to register', err)
      setFormError('Не удалось завершить регистрацию. Проверьте соединение с сервером и попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  const goBack = () => {
    navigate(-1)
  }

  const headline = 'Регистрация в городском реестре'
  const subtitle =
    method === 'clerk'
      ? 'Clerk привязывает прогресс к аккаунту и позволяет входить с разных устройств.'
      : 'Регистрация по паролю: восстановления пока нет — сохраните никнейм и пароль.'

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-gray-950/60 backdrop-blur p-5 space-y-4">
          <div className="space-y-2">
            <Heading level={2}>{headline}</Heading>
            <Text variant="muted" size="sm">
              {subtitle}
            </Text>
          </div>

          <div className="flex gap-2">
            <Button
              variant={method === 'password' ? 'primary' : 'secondary'}
              onClick={() => setMethod('password')}
              disabled={isSubmitting}
            >
              По паролю
            </Button>
            <Button
              variant={method === 'clerk' ? 'primary' : 'secondary'}
              onClick={() => setMethod('clerk')}
              disabled={isSubmitting}
            >
              Через Clerk
            </Button>
          </div>

          <div className="space-y-2">
            <Text variant="muted" size="sm">
              Никнейм
            </Text>
            <input
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                setFormError(null)
              }}
              placeholder="Ваш никнейм"
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/20"
              disabled={isSubmitting || isPlayerLoading || !isLoaded}
              autoFocus
            />
          </div>

          {method === 'password' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Text variant="muted" size="sm">
                  Пароль
                </Text>
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setFormError(null)
                  }}
                  type="password"
                  placeholder={`Мин. ${MIN_PASSWORD_LENGTH} символов`}
                  className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/20"
                  disabled={isSubmitting || isPlayerLoading || !isLoaded}
                />
              </div>

              <div className="space-y-2">
                <Text variant="muted" size="sm">
                  Повторите пароль
                </Text>
                <input
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value)
                    setFormError(null)
                  }}
                  type="password"
                  placeholder="Повторите пароль"
                  className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/20"
                  disabled={isSubmitting || isPlayerLoading || !isLoaded}
                />
              </div>
            </div>
          )}

          {method === 'clerk' && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              {isSignedIn ? (
                <Text variant="muted" size="sm">
                  Вы вошли как {user?.primaryEmailAddress?.emailAddress ?? user?.username ?? 'пользователь'}.
                </Text>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Text variant="muted" size="sm">
                    Войдите/зарегистрируйтесь в Clerk, чтобы продолжить.
                  </Text>
                  <SignInButton mode="modal">
                    <Button variant="secondary" disabled={isSubmitting}>
                      Войти в Clerk
                    </Button>
                  </SignInButton>
                </div>
              )}
            </div>
          )}

          {formError && (
            <div className="text-sm text-red-200 bg-red-950/30 border border-red-500/30 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={goBack} disabled={isSubmitting}>
              Назад
            </Button>
            <Button onClick={submit} loading={isSubmitting} disabled={!isLoaded || isPlayerLoading}>
              Завершить регистрацию
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CityRegistrationPage

