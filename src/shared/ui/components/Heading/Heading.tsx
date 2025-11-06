import React, { createElement } from 'react'
import { cn } from '../../../lib/utils/cn'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel
  children: React.ReactNode
}

const levelClasses = {
  1: 'text-5xl font-bold text-[color:var(--color-text)]',
  2: 'text-4xl font-bold text-[color:var(--color-text)]',
  3: 'text-3xl font-semibold text-[color:var(--color-text)]',
  4: 'text-2xl font-semibold text-[color:var(--color-text)]',
  5: 'text-xl font-medium text-[color:var(--color-text)]',
  6: 'text-lg font-medium text-[color:var(--color-text)]'
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level, children, ...props }, ref) => {
    const Component = `h${level}` as keyof React.JSX.IntrinsicElements

    return createElement(
      Component,
      {
        className: cn(levelClasses[level], className),
        ref,
        ...props
      },
      children
    )
  }
)

Heading.displayName = 'Heading'
