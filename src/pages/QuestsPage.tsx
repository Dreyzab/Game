import React from 'react'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { QuestList } from '@/features/quests'

import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

export const QuestsPage: React.FC = () => {
    return (
        <Layout>
            <div className="mb-8 text-center">
                <Heading level={1}>Журнал заданий</Heading>
                <Text variant="muted" size="sm" className="mt-3 uppercase tracking-[0.28em]">
                    Текущие цели и выполненные миссии
                </Text>
            </div>

            <div className="panel-grid">
                <div className="panel-span-12 md:panel-span-8 md:panel-start-3">
                    <div className="glass-panel p-6">
                        <ErrorBoundary
                            onError={(error) => console.error('QuestList Error:', error)}
                            fallback={<div className="text-red-500 p-4">Ошибка загрузки заданий</div>}
                        >
                            <QuestList />
                        </ErrorBoundary>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default QuestsPage
