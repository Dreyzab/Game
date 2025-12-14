import React from 'react'

export const PvPBattleScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="text-5xl">🛡️</div>
        <div className="text-2xl font-bold">PvP бой временно отключён</div>
        <div className="text-gray-400">Перенос на /pvp API (Bun + Elysia) запланирован.</div>
      </div>
    </div>
  )
}

export default PvPBattleScreen
