import React from 'react'
import { Button } from '../../shared/ui/components/Button'
import { Text } from '../../shared/ui/components/Text'
import { MotionContainer } from '../../shared/ui/components/MotionContainer'

export interface AuthActionsProps {
  onStartGame: () => void
  onCreatePlayer: () => void
  onRegisterAdmin: () => void
  createMsg?: string | null
  isCreating?: boolean
  hasUnallocatedSkills?: boolean
}

export const AuthActions: React.FC<AuthActionsProps> = ({
  onStartGame,
  onCreatePlayer,
  onRegisterAdmin,
  createMsg,
  isCreating = false,
  hasUnallocatedSkills = false
}) => {
  return (
    <MotionContainer
      className="mt-10 text-center"
      direction="fade"
      delay={0.5}
    >
      <Button
        variant="secondary"
        size="md"
        uppercase
        tracking="0.32em"
        onClick={onStartGame}
        className="mr-3"
      >
        <span className="h-2 w-2 rounded-full bg-[color:var(--color-cyan)]" />
        Начать игру
      </Button>

      {hasUnallocatedSkills && (
        <Text
          variant="accent"
          size="xs"
          className="mt-2 block"
        >
          У вас есть нераспределённые очки навыков
        </Text>
      )}

      <div className="mt-4" />

      <Button
        variant="secondary"
        size="md"
        uppercase
        tracking="0.32em"
        onClick={onCreatePlayer}
        disabled={isCreating}
        className="mr-3"
      >
        <span className="h-2 w-2 rounded-full bg-[color:var(--color-cyan)]" />
        {isCreating ? 'Создание…' : 'Создать игрока'}
      </Button>

      {createMsg && (
        <Text
          variant="accent"
          size="xs"
          className="mt-2 block"
        >
          {createMsg}
        </Text>
      )}

      <Button
        variant="admin"
        size="md"
        onClick={onRegisterAdmin}
        className="mt-4"
      >
        <span className="h-2 w-2 rounded-full bg-[color:var(--color-cyan)]" />
        Зарегистрироваться админом (dev)
      </Button>
    </MotionContainer>
  )
}
