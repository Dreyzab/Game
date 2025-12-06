/**
 * CoopPage - Страница локального кооператива
 * 
 * Маршрутизация:
 * - /coop - Создание комнаты / ввод кода
 * - /coop/:roomCode - Лобби комнаты
 * - /coop/:roomCode/battle - Боевой экран
 * - /coop/:roomCode/results - Результаты боя
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { CoopLobby, RoomLobby, CoopBattleScreen } from '@/features/coop';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils/cn';

// ============================================================================
// RESULTS SCREEN
// ============================================================================

const CoopResultsScreen = ({ roomCode }: { roomCode: string }) => {
  const navigate = useNavigate();
  const room = useQuery(api["coop/rooms"].getRoomByCode, { roomCode });
  
  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Загрузка...
      </div>
    );
  }
  
  const isVictory = room.log.some((l: any) => l.action === 'victory');
  
  return (
    <div className={cn(
      "min-h-screen text-white p-6",
      "bg-gradient-to-b",
      isVictory 
        ? "from-green-900/50 via-gray-900 to-gray-950" 
        : "from-red-900/50 via-gray-900 to-gray-950"
    )}>
      <div className="max-w-md mx-auto text-center">
        {/* Result Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-8xl mb-6"
        >
          {isVictory ? '🏆' : '💀'}
        </motion.div>
        
        {/* Result Text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "text-4xl font-bold mb-4",
            isVictory ? "text-green-400" : "text-red-400"
          )}
        >
          {isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-400 mb-8"
        >
          {isVictory 
            ? 'Отряд успешно выполнил миссию!' 
            : 'Отряд был уничтожен. Попробуйте снова.'}
        </motion.p>
        
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-800/50 rounded-xl p-4 mb-8 border border-gray-700"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Раундов</div>
              <div className="text-xl font-bold">{room.currentRound}</div>
            </div>
            <div>
              <div className="text-gray-500">Действий</div>
              <div className="text-xl font-bold">
                {room.log.filter((l: any) => l.actorId !== 'system').length}
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Battle Log Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-black/30 rounded-xl p-3 mb-8 max-h-40 overflow-y-auto text-left"
        >
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Журнал боя
          </div>
          {room.log.slice(-10).map((log: any, i: number) => (
            <div key={i} className="text-xs text-gray-400 mb-1 font-mono">
              <span className="text-gray-600">[R{log.round}]</span>{' '}
              {log.actorName}: {log.action}
              {log.damage && <span className="text-red-400"> -{log.damage}</span>}
            </div>
          ))}
        </motion.div>
        
        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate('/coop')}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg",
              "bg-gradient-to-r from-cyan-600 to-purple-600",
              "hover:from-cyan-500 hover:to-purple-500 transition-all"
            )}
          >
            Новая Игра
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
          >
            На главную
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// BATTLE WRAPPER
// ============================================================================

const CoopBattleWrapper = ({ roomCode }: { roomCode: string }) => {
  const { deviceId } = useDeviceId();
  const room = useQuery(api["coop/rooms"].getRoomByCode, { roomCode });
  
  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-gray-400">Поиск комнаты...</div>
        </div>
      </div>
    );
  }
  
  // Redirect to results if finished
  if (room.status === 'finished') {
    return <CoopResultsScreen roomCode={roomCode} />;
  }
  
  // Redirect to lobby if not started
  if (room.status === 'lobby') {
    return <RoomLobby roomCode={roomCode} />;
  }
  
  return <CoopBattleScreen roomCode={roomCode} />;
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const CoopPage = () => {
  const { roomCode, '*': subPath } = useParams<{ roomCode?: string; '*'?: string }>();
  
  // /coop - Create/Join
  if (!roomCode) {
    return <CoopLobby />;
  }
  
  // /coop/:roomCode/battle
  if (subPath === 'battle') {
    return <CoopBattleWrapper roomCode={roomCode} />;
  }
  
  // /coop/:roomCode/results
  if (subPath === 'results') {
    return <CoopResultsScreen roomCode={roomCode} />;
  }
  
  // /coop/:roomCode - Lobby
  return <RoomLobby roomCode={roomCode} />;
};

export default CoopPage;

