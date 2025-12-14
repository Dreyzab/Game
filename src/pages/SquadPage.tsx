import React from 'react'

const SquadPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="text-5xl">🛡️</div>
        <div className="text-2xl font-bold">Отряды временно отключены</div>
        <div className="text-gray-400">Сквад-API будет доступен через /squad endpoint.</div>
      </div>
    </div>
  )
}

export default SquadPage
