import React from 'react'
import { useParams } from 'react-router-dom'
import PvPBattleScreenWrapper from '@/features/pvp/PvPBattleScreen'

const PvPPage = () => {
    const { battleId } = useParams<{ battleId: string }>()

    if (!battleId) {
        return <div>Invalid Battle ID</div>
    }

    return <PvPBattleScreenWrapper battleId={battleId} />
}

export default PvPPage
