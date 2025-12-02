import React from 'react'
import { ModernInventoryPage } from '@/features/inventory/ui/InventoryPage'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

const InventoryPage: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('❌ [InventoryPage] Error:', error)
        console.error('📋 [InventoryPage] Stack:', errorInfo.componentStack)
      }}
    >
      <ModernInventoryPage />
    </ErrorBoundary>
  )
}

export default InventoryPage

