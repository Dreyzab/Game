import React from 'react'

// Старая арена отключена. Используйте TutorialBattle или ArenaBattle.
export const BattleArena: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="text-5xl">🛑</div>
        <div className="text-2xl font-bold">Старая арена отключена</div>
        <div className="text-gray-400">Используйте новый /combat API (Bun + Elysia).</div>
      </div>
    </div>
  )
}

export default BattleArena




