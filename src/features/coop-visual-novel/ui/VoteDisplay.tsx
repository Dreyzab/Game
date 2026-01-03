import React from 'react'

export interface VoteDisplayProps {
  votes: any[]
  participants: Array<{ id: number; name: string }>
  choices: Array<{ id: string; text: string }>
  sceneId: string
}

export const VoteDisplay: React.FC<VoteDisplayProps> = ({ votes, participants, choices, sceneId }) => {
  if (!votes || votes.length === 0) return null

  return (
    <div className="absolute bottom-32 right-4 z-40 max-w-xs">
      <div className="rounded-xl bg-black/60 border border-white/10 backdrop-blur-md p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Голоса</div>
        <div className="space-y-1">
          {votes.map((vote: any) => {
            const participant = participants.find((p) => p.id === vote.voterId)
            const choice = choices.find((c) => c.id === vote.choiceId)
            if (!participant || !choice) return null
            if (typeof vote.sceneId === 'string' && vote.sceneId !== sceneId) return null
            return (
              <div key={vote.id ?? `${vote.voterId}:${vote.choiceId}`} className="text-xs">
                <span className="text-cyan-300 font-semibold">{participant.name}</span>
                <span className="text-slate-500 mx-1">→</span>
                <span className="text-slate-300">{choice.text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
