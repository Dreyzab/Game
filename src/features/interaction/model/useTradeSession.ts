
import { useState, useCallback, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useInventoryStore } from '@/entities/inventory'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import type { ItemState } from '@/entities/item/model/types'
import { authenticatedClient } from '@/shared/api/client'
import { calculateVendorBuyPrice, calculateVendorSellPrice } from '@/shared/lib/itemPricing'
import { useAppAuth } from '@/shared/auth'
import type { TradeInteraction, TradeItem } from './mapPointInteractions'

// --- Pure Helper Functions ---

const getTraderItemPrice = (item: TradeItem): number => {
    if (typeof item.price === 'number') return item.price
    const template = ITEM_TEMPLATES[item.templateId]
    if (!template) return 10
    return calculateVendorSellPrice(template)
}

const getPlayerItemPrice = (item: ItemState): number => {
    const template = ITEM_TEMPLATES[item.templateId]
    if (!template) return 10
    return calculateVendorBuyPrice(template)
}

// --- Types ---

interface UseTradeSessionProps {
    interaction: TradeInteraction
    onClose?: () => void
}

interface TradeSessionResult {
    // State
    traderOfferIds: string[]
    playerOfferIds: string[]
    error: string | null
    isPending: boolean
    isSuccess: boolean

    // Computed
    traderInventory: TradeItem[]
    traderOffer: TradeItem[]
    playerInventory: ItemState[]
    playerOffer: ItemState[]
    traderTotal: number
    playerTotal: number
    balance: number

    // Actions
    toggleTraderItem: (id: string) => void
    togglePlayerItem: (id: string) => void
    executeTrade: () => void
    getTraderPrice: (item: TradeItem) => number
    getPlayerPrice: (item: ItemState) => number
}

// --- Hook ---

export const useTradeSession = ({ interaction }: UseTradeSessionProps): TradeSessionResult => {
    const { getToken } = useAppAuth()
    const queryClient = useQueryClient()
    const { items: playerItemsMap, isQuestItem } = useInventoryStore()
    const playerItems = useMemo(() => Object.values(playerItemsMap), [playerItemsMap])

    // Local State
    const [traderOfferIds, setTraderOfferIds] = useState<string[]>([])
    const [playerOfferIds, setPlayerOfferIds] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    // Derived Lists
    const traderInventory = useMemo(() =>
        interaction.inventory.filter(item => !traderOfferIds.includes(item.id)),
        [interaction.inventory, traderOfferIds]
    )

    const traderOffer = useMemo(() =>
        interaction.inventory.filter(item => traderOfferIds.includes(item.id)),
        [interaction.inventory, traderOfferIds]
    )

    const playerInventory = useMemo(() =>
        playerItems.filter(item => !playerOfferIds.includes(item.id)),
        [playerItems, playerOfferIds]
    )

    const playerOffer = useMemo(() =>
        playerItems.filter(item => playerOfferIds.includes(item.id)),
        [playerItems, playerOfferIds]
    )

    // Computed Totals
    const traderTotal = useMemo(() =>
        traderOffer.reduce((sum, item) => sum + getTraderItemPrice(item), 0),
        [traderOffer]
    )

    const playerTotal = useMemo(() =>
        playerOffer.reduce((sum, item) => sum + getPlayerItemPrice(item), 0),
        [playerOffer]
    )

    const balance = playerTotal - traderTotal

    // Mutation
    const tradeMutation = useMutation({
        mutationFn: async (payload: {
            playerOfferIds: string[]
            traderOffer: Array<{ templateId: string; quantity: number }>
            npcId?: string
        }) => {
            const token = await getToken()
            const client = authenticatedClient(token || undefined)
            const { data, error } = await client.inventory.trade.execute.post(payload)
            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myInventory'] })
            setTraderOfferIds([])
            setPlayerOfferIds([])
            setError(null)
        },
        onError: (err: Error) => {
            setError(err.message || 'Ошибка при обмене')
        }
    })

    // Actions
    const toggleTraderItem = useCallback((id: string) => {
        setTraderOfferIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
        if (tradeMutation.isSuccess) tradeMutation.reset()
    }, [tradeMutation])

    const togglePlayerItem = useCallback((id: string) => {
        const item = playerItemsMap[id]
        if (item && isQuestItem(item.id)) {
            setError('Нельзя продать квестовый предмет')
            return
        }

        setError(null)
        setPlayerOfferIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
        if (tradeMutation.isSuccess) tradeMutation.reset()
    }, [playerItemsMap, isQuestItem, tradeMutation])

    const executeTrade = useCallback(() => {
        if (traderOffer.length === 0 && playerOffer.length === 0) return

        if (balance < 0) {
            setError(`Недостаточно предметов. Нужно добавить ещё ${Math.abs(balance)} ${interaction.currency}`)
            return
        }

        setError(null)

        const payload = {
            playerOfferIds: playerOffer.map(item => item.id),
            traderOffer: traderOffer.map(item => ({
                templateId: item.templateId,
                quantity: 1
            })),
            npcId: interaction.npcId
        }

        tradeMutation.mutate(payload)
    }, [balance, interaction.currency, interaction.npcId, playerOffer, traderOffer, tradeMutation])

    return {
        traderOfferIds,
        playerOfferIds,
        error,
        isPending: tradeMutation.isPending,
        isSuccess: tradeMutation.isSuccess,
        traderInventory,
        traderOffer,
        playerInventory,
        playerOffer,
        traderTotal,
        playerTotal,
        balance,
        toggleTraderItem,
        togglePlayerItem,
        executeTrade,
        getTraderPrice: getTraderItemPrice,
        getPlayerPrice: getPlayerItemPrice
    }
}
