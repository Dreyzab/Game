import { useParams } from 'react-router-dom'
import PvPBattleScreenWrapper from '@/features/pvp/PvPBattleScreen'
import { PvPLobby } from '@/features/pvp/PvPLobby'

const PvPPage = () => {
    const { battleId } = useParams<{ battleId: string }>()

    if (!battleId) {
        return <PvPLobby />
    }

    return <PvPBattleScreenWrapper battleId={battleId} />
}

export default PvPPage
