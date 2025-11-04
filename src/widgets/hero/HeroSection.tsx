import React from 'react'
import { Badge } from '../../shared/ui/components/Badge'
import { Heading } from '../../shared/ui/components/Heading'
import { Text } from '../../shared/ui/components/Text'
import { MotionContainer } from '../../shared/ui/components/MotionContainer'

export interface HeroSectionProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  badge
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Доброе утро'
    if (hour < 17) return 'Добрый день'
    return 'Добрый вечер'
  }

  return (
    <MotionContainer
      className="mb-12 text-center"
      direction="up"
      delay={0.2}
    >
      {badge && (
        <div className="mx-auto mb-3">
          <Badge variant="glow">
            {badge}
          </Badge>
        </div>
      )}
      <Heading level={1} className="text-center">
        {title}
      </Heading>
      {subtitle && (
        <Text
          variant="muted"
          size="sm"
          className="mt-4 uppercase tracking-[0.35em]"
        >
          {subtitle}
        </Text>
      )}
      <Text
        variant="muted"
        size="sm"
        className="mt-4 uppercase tracking-[0.35em]"
      >
        {getGreeting()}, игрок!
      </Text>
    </MotionContainer>
  )
}
