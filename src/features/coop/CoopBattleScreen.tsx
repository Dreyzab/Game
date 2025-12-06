/**
 * CoopBattleScreen - Асимметричный боевой интерфейс
 * 
 * Каждая роль видит РАЗНУЮ информацию:
 * - BODY: точные HP, броня
 * - MIND: слабости, шансы
 * - SOCIAL: намерения, мораль
 * 
 * Механика WeGo: все выбирают действия, потом одновременное исполнение
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { cn } from '@/shared/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import type { Id } from '@convex/_generated/dataModel';

// ============================================================================
// TYPES
// ============================================================================

type Role = 'BODY' | 'MIND' | 'SOCIAL';

interface Card {
  id: string;
  name: string;
  cost: number;
  type: string;
  damage?: number;
  defense?: number;
  effects?: string[];
  range?: number[];
  voiceScaling?: string;
}

// ============================================================================
// ROLE THEME CONFIG
// ============================================================================

const ROLE_THEMES: Record<Role, {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  icon: string;
}> = {
  BODY: {
    primary: 'text-red-400',
    secondary: 'text-red-300',
    accent: 'border-red-500',
    gradient: 'from-red-900/30 via-gray-900 to-gray-900',
    icon: '💪',
  },
  MIND: {
    primary: 'text-cyan-400',
    secondary: 'text-cyan-300',
    accent: 'border-cyan-500',
    gradient: 'from-cyan-900/30 via-gray-900 to-gray-900',
    icon: '🧠',
  },
  SOCIAL: {
    primary: 'text-purple-400',
    secondary: 'text-purple-300',
    accent: 'border-purple-500',
    gradient: 'from-purple-900/30 via-gray-900 to-gray-900',
    icon: '🎭',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Enemy Card - отображение врага с учётом роли
 */
const EnemyCard = ({ 
  enemy, 
  role,
  isTargeted,
  onTarget 
}: { 
  enemy: any;
  role: Role;
  isTargeted: boolean;
  onTarget: () => void;
}) => {
  const theme = ROLE_THEMES[role];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTarget}
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all cursor-pointer",
        "bg-gray-800/80 backdrop-blur-sm",
        isTargeted ? `${theme.accent} ring-2 ring-white/20` : "border-gray-700 hover:border-gray-500"
      )}
    >
      {/* Enemy Name & Rank */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-bold text-lg">{enemy.name}</div>
          <div className="text-xs text-gray-500">Ранг {enemy.rank}</div>
        </div>
        <div className="text-2xl">🐺</div>
      </div>
      
      {/* HP Bar (BODY видит точно, остальные - описание) */}
      {role === 'BODY' && enemy.hp !== undefined ? (
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-400">HP</span>
            <span>{enemy.hp}/{enemy.maxHp}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-600 to-red-400"
              initial={{ width: 0 }}
              animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-2 text-sm text-gray-400">
          {enemy.hpDescription || 'Состояние неизвестно'}
        </div>
      )}
      
      {/* Role-specific info */}
      {role === 'BODY' && enemy.armor !== undefined && (
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <span>🛡️</span>
          <span>Броня: {enemy.armor}</span>
        </div>
      )}
      
      {role === 'MIND' && enemy.weaknesses && (
        <div className="mt-2">
          <div className="text-xs text-cyan-400 mb-1">Слабости:</div>
          <div className="flex flex-wrap gap-1">
            {enemy.weaknesses.map((w: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-cyan-900/50 rounded text-xs text-cyan-300">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {role === 'SOCIAL' && (
        <>
          {enemy.intention && (
            <div className="mt-2 text-sm">
              <span className="text-purple-400">Намерение: </span>
              <span className="text-white">{enemy.intentionText || enemy.intention}</span>
            </div>
          )}
          {enemy.morale !== undefined && (
            <div className="mt-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-purple-400">Мораль</span>
                <span>{enemy.morale}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                  animate={{ width: `${enemy.morale}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Role Hints */}
      {enemy.roleHints && enemy.roleHints.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          {enemy.roleHints.map((hint: string, i: number) => (
            <div key={i} className={cn("text-xs", theme.secondary)}>
              💡 {hint}
            </div>
          ))}
        </div>
      )}
      
      {/* Target Indicator */}
      {isTargeted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
        >
          <span className="text-xs">🎯</span>
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Card Component - боевая карта игрока
 */
const BattleCard = ({
  card,
  index,
  isSelected,
  isDisabled,
  efficacy,
  onSelect,
}: {
  card: Card;
  index: number;
  isSelected: boolean;
  isDisabled: boolean;
  efficacy: number;
  onSelect: () => void;
}) => (
  <motion.div
    whileHover={isDisabled ? {} : { y: -8, scale: 1.02 }}
    whileTap={isDisabled ? {} : { scale: 0.98 }}
    onClick={isDisabled ? undefined : onSelect}
    className={cn(
      "relative w-24 h-36 rounded-lg border-2 p-2 transition-all cursor-pointer",
      "bg-gradient-to-b from-gray-700 to-gray-800",
      isSelected && "border-yellow-400 ring-2 ring-yellow-400/30 -translate-y-2",
      isDisabled && "opacity-50 cursor-not-allowed grayscale",
      !isSelected && !isDisabled && "border-gray-600 hover:border-gray-400"
    )}
  >
    {/* Cost Badge */}
    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
      {card.cost}
    </div>
    
    {/* Efficacy Warning */}
    {efficacy < 1 && (
      <div className="absolute top-0 left-0 right-0 bg-red-500/80 text-[10px] text-center font-bold rounded-t">
        {Math.round(efficacy * 100)}%
      </div>
    )}
    
    {/* Card Content */}
    <div className="h-full flex flex-col justify-between">
      <div className="text-xs font-bold text-center truncate">{card.name}</div>
      
      <div className="text-center">
        {card.type === 'attack' && (
          <div className="text-lg font-bold text-red-400">⚔️ {card.damage}</div>
        )}
        {card.type === 'defense' && (
          <div className="text-lg font-bold text-blue-400">🛡️ {card.defense}</div>
        )}
        {card.type === 'utility' && (
          <div className="text-lg">✨</div>
        )}
        {card.type === 'support' && (
          <div className="text-lg">💚</div>
        )}
      </div>
      
      {/* Range */}
      {card.range && (
        <div className="text-[10px] text-center text-gray-400">
          Ранг: {card.range.join(',')}
        </div>
      )}
    </div>
  </motion.div>
);

/**
 * Ally Status - статус союзника
 */
const AllyStatus = ({ 
  ally, 
  role,
  intent 
}: { 
  ally: any;
  role: Role;
  intent?: any;
}) => {
  const roleConfig = ROLE_THEMES[ally.role as Role];
  
  return (
    <div className={cn(
      "p-2 rounded-lg border",
      "bg-gray-800/50 border-gray-700"
    )}>
      <div className="flex items-center gap-2">
        <div className="text-xl">{roleConfig?.icon || '👤'}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{ally.playerName}</div>
          <div className="text-xs text-gray-500">Ранг {ally.rank}</div>
        </div>
      </div>
      
      {/* HP (if visible for this role) */}
      {ally.hp !== undefined && (
        <div className="mt-1">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500"
              style={{ width: `${(ally.hp / ally.maxHp) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Intent indicator */}
      {intent?.currentTarget && (
        <div className="mt-1 text-xs text-yellow-400 flex items-center gap-1">
          <span>👁️</span>
          <span>Смотрит на цель</span>
        </div>
      )}
    </div>
  );
};

/**
 * Ready Status Bar
 */
const ReadyStatusBar = ({ 
  readyStatus,
  onReady,
  isReady,
  isAllReady 
}: { 
  readyStatus: any;
  onReady: () => void;
  isReady: boolean;
  isAllReady: boolean;
}) => (
  <div className="p-3 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-400">
        Готовность: {readyStatus?.readyCount || 0}/{readyStatus?.totalCount || 0}
      </span>
      {isAllReady && (
        <span className="text-sm text-green-400 animate-pulse">
          Все готовы!
        </span>
      )}
    </div>
    
    <div className="flex gap-1">
      {readyStatus?.statuses?.map((s: any) => (
        <div 
          key={s.playerId}
          className={cn(
            "flex-1 h-2 rounded-full transition-all",
            s.isReady ? "bg-green-500" : "bg-gray-600"
          )}
        />
      ))}
    </div>
  </div>
);

/**
 * What To Ask Panel - подсказки что спросить у союзников
 */
const WhatToAskPanel = ({ questions }: { questions: any[] }) => (
  <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
    <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
      💬 Спросите у союзников:
    </div>
    {questions?.map((q, i) => (
      <div key={i} className="mb-2 last:mb-0">
        <div className="text-xs font-bold text-cyan-400">{q.askRole}:</div>
        <ul className="text-xs text-gray-300 ml-2">
          {q.questions.slice(0, 2).map((question: string, j: number) => (
            <li key={j}>• {question}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

/**
 * Combat Log
 */
const CombatLog = ({ logs }: { logs: any[] }) => {
  const recentLogs = logs.slice(-5).reverse();
  
  return (
    <div className="p-2 bg-black/50 rounded-lg max-h-32 overflow-y-auto font-mono text-xs">
      {recentLogs.map((log, i) => (
        <div key={i} className="mb-1 text-gray-400">
          <span className="text-gray-600">[R{log.round}]</span>{' '}
          <span className="text-white">{log.actorName}</span>{' '}
          <span>{log.action}</span>
          {log.damage && <span className="text-red-400"> (-{log.damage})</span>}
          {log.effects && (
            <span className="text-cyan-400"> [{log.effects.join(', ')}]</span>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CoopBattleScreenProps {
  roomCode: string;
}

export const CoopBattleScreen = ({ roomCode }: CoopBattleScreenProps) => {
  const { deviceId } = useDeviceId();
  const navigate = useNavigate();
  
  // Local State
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  
  // Get room first
  const room = useQuery(api["coop/rooms"].getRoomByCode, { roomCode });
  
  // Queries (dependent on room)
  const gameState = useQuery(
    api["coop/asymmetry"].getFilteredGameState,
    room && deviceId ? { deviceId, roomId: room._id } : 'skip'
  );
  
  const readyStatus = useQuery(
    api["coop/coopActions"].getReadyStatus,
    room ? { roomId: room._id } : 'skip'
  );
  
  const teammateIntents = useQuery(
    api["coop/presence"].getTeammateIntents,
    room && deviceId ? { deviceId, roomId: room._id } : 'skip'
  );
  
  const whatToAsk = useQuery(
    api["coop/asymmetry"].getWhatToAsk,
    room && deviceId ? { deviceId, roomId: room._id } : 'skip'
  );
  
  // Mutations
  const commitAction = useMutation(api["coop/coopActions"].commitAction);
  const cancelAction = useMutation(api["coop/coopActions"].cancelAction);
  const resolveRound = useMutation(api["coop/coopActions"].resolveRound);
  const sendHeartbeat = useMutation(api["coop/presence"].sendHeartbeat);
  const updateIntent = useMutation(api["coop/presence"].updateIntent);
  
  // Heartbeat
  useEffect(() => {
    if (!room || !deviceId) return;
    
    const interval = setInterval(() => {
      sendHeartbeat({
        deviceId,
        roomId: room._id,
        currentTarget: selectedTargetId || undefined,
        hoveredCardIndex: selectedCardIndex ?? undefined,
      }).catch(console.error);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [room, deviceId, selectedTargetId, selectedCardIndex]);
  
  // Update intent when selection changes
  useEffect(() => {
    if (!room || !deviceId) return;
    updateIntent({
      deviceId,
      roomId: room._id,
      currentTarget: selectedTargetId || undefined,
      hoveredCardIndex: selectedCardIndex ?? undefined,
    }).catch(console.error);
  }, [selectedTargetId, selectedCardIndex]);
  
  // Auto-resolve when all ready
  useEffect(() => {
    if (readyStatus?.allReady && room?.status === 'planning') {
      // Small delay for UI feedback
      const timeout = setTimeout(() => {
        resolveRound({ roomId: room._id }).catch(console.error);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [readyStatus?.allReady, room?.status]);
  
  // Redirect if finished
  useEffect(() => {
    if (room?.status === 'finished') {
      setTimeout(() => navigate(`/coop/${roomCode}/results`), 2000);
    }
  }, [room?.status]);
  
  // Handlers
  const handleCommit = async () => {
    if (!room || !deviceId || selectedCardIndex === null || !selectedTargetId) return;
    
    try {
      await commitAction({
        deviceId,
        roomId: room._id,
        cardIndex: selectedCardIndex,
        targetId: selectedTargetId,
        targetType: 'enemy',
      });
      // Reset selection after commit
      setSelectedCardIndex(null);
      setSelectedTargetId(null);
    } catch (e: any) {
      alert(e.message || 'Ошибка');
    }
  };
  
  const handleCancel = async () => {
    if (!room || !deviceId) return;
    try {
      await cancelAction({ deviceId, roomId: room._id });
    } catch (e) {
      console.error(e);
    }
  };
  
  // Loading
  if (!room || !gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-gray-400">Загрузка боя...</div>
        </div>
      </div>
    );
  }
  
  const role = gameState.myRole as Role;
  const theme = ROLE_THEMES[role];
  const myState = gameState.myState;
  const isReady = readyStatus?.statuses?.find(
    (s: any) => s.playerId === gameState.myPlayerId
  )?.isReady;
  
  // Calculate card efficacy
  const getCardEfficacy = (card: Card) => {
    if (card.range && !card.range.includes(gameState.myRank)) {
      return 0.6;
    }
    return 1.0;
  };
  
  return (
    <div className={cn(
      "min-h-screen text-white",
      "bg-gradient-to-b",
      theme.gradient
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{theme.icon}</span>
          <div>
            <div className={cn("font-bold", theme.primary)}>{gameState.myRoleName}</div>
            <div className="text-xs text-gray-400">Ранг {gameState.myRank}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Раунд {gameState.globalState.currentRound}</div>
          <div className={cn("text-xs", 
            gameState.globalState.status === 'planning' ? 'text-yellow-400' : 'text-green-400'
          )}>
            {gameState.globalState.status === 'planning' ? 'Планирование' : 'Исполнение'}
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Role Description */}
        <div className={cn(
          "p-3 rounded-lg border",
          "bg-gray-800/30",
          theme.accent
        )}>
          <div className="text-xs">{gameState.roleDescription}</div>
        </div>
        
        {/* Enemies */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Враги</div>
          <div className="grid gap-3">
            {gameState.enemies.map((enemy: any) => (
              <EnemyCard
                key={enemy.id}
                enemy={enemy}
                role={role}
                isTargeted={selectedTargetId === enemy.id}
                onTarget={() => setSelectedTargetId(enemy.id)}
              />
            ))}
          </div>
        </div>
        
        {/* Allies */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Отряд</div>
          <div className="grid grid-cols-3 gap-2">
            {gameState.allies
              .filter((a: any) => a.playerId !== gameState.myPlayerId)
              .map((ally: any) => (
                <AllyStatus
                  key={ally.playerId}
                  ally={ally}
                  role={role}
                  intent={teammateIntents?.find((i: any) => i.playerId === ally.playerId)}
                />
              ))}
          </div>
        </div>
        
        {/* What to Ask */}
        {whatToAsk && whatToAsk.length > 0 && (
          <WhatToAskPanel questions={whatToAsk} />
        )}
        
        {/* Ready Status */}
        {readyStatus && (
          <ReadyStatusBar
            readyStatus={readyStatus}
            onReady={handleCommit}
            isReady={isReady}
            isAllReady={readyStatus.allReady}
          />
        )}
        
        {/* Combat Log */}
        <CombatLog logs={gameState.log} />
        
        {/* My Stats */}
        <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex justify-between mb-2">
            <div className="text-xs text-gray-400">HP</div>
            <div className="text-sm">{myState.hp}/{myState.maxHp}</div>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-red-500"
              style={{ width: `${(myState.hp / myState.maxHp) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between mb-1">
            <div className="text-xs text-gray-400">Стамина</div>
            <div className="text-sm">{myState.stamina}/{myState.maxStamina}</div>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500"
              style={{ width: `${(myState.stamina / myState.maxStamina) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Hand */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Рука</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {myState.hand.map((card: Card, index: number) => (
              <BattleCard
                key={`${card.id}-${index}`}
                card={card}
                index={index}
                isSelected={selectedCardIndex === index}
                isDisabled={card.cost > myState.stamina || isReady}
                efficacy={getCardEfficacy(card)}
                onSelect={() => setSelectedCardIndex(index)}
              />
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isReady ? (
            <>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 font-bold"
              >
                Отмена
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCommit}
                disabled={selectedCardIndex === null || !selectedTargetId}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold transition-all",
                  "bg-gradient-to-r",
                  selectedCardIndex !== null && selectedTargetId
                    ? "from-green-600 to-emerald-600 text-white"
                    : "from-gray-600 to-gray-700 text-gray-400 cursor-not-allowed"
                )}
              >
                Готов!
              </motion.button>
            </>
          ) : (
            <div className="flex-1 py-3 rounded-xl bg-green-900/30 border border-green-700 text-center">
              <span className="text-green-400">✓ Ожидание союзников...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoopBattleScreen;

