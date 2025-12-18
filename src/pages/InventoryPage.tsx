import React from 'react'
import { TrinityInventoryPage } from '@/features/trinity-protocol-inventory'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

const InventoryPage: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('❌ [InventoryPage] Error:', error)
        console.error('📋 [InventoryPage] Stack:', errorInfo.componentStack)
      }}
    >
      <TrinityInventoryPage />
    </ErrorBoundary>
  )
}

export default InventoryPage
