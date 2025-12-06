/**
 * CoopLobby - Лобби кооперативного режима
 * 
 * Паттерн Jackbox: 4-буквенный код + QR для быстрого подключения
 * Визуализация ролей BODY/MIND/SOCIAL
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useNavigate } from 'react-router-dom';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { cn } from '@/shared/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

type Role = 'BODY' | 'MIND' | 'SOCIAL';

interface RoleConfig {
  id: Role;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  bgGradient: string;
  description: string;
  shortDesc: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLES: RoleConfig[] = [
  {
    id: 'BODY',
    name: 'Физик',
    nameEn: 'The Body',
    icon: '💪',
    color: 'text-red-400',
    bgGradient: 'from-red-900/30 to-red-800/10',
    description: 'Видит точное здоровье врагов, броню и физические угрозы',
    shortDesc: 'HP • Броня • Угрозы',
  },
  {
    id: 'MIND',
    name: 'Разум',
    nameEn: 'The Mind',
    icon: '🧠',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-900/30 to-cyan-800/10',
    description: 'Анализирует слабости, вероятности успеха и скрытые объекты',
    shortDesc: 'Слабости • Шансы • Анализ',
  },
  {
    id: 'SOCIAL',
    name: 'Лицо',
    nameEn: 'The Face',
    icon: '🎭',
    color: 'text-purple-400',
    bgGradient: 'from-purple-900/30 to-purple-800/10',
    description: 'Видит намерения врагов, мораль и возможности переговоров',
    shortDesc: 'Намерения • Мораль • Диалоги',
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const RoleCard = ({ 
  role, 
  isSelected, 
  isTaken, 
  takenBy,
  onClick 
}: { 
  role: RoleConfig;
  isSelected: boolean;
  isTaken: boolean;
  takenBy?: string;
  onClick: () => void;
}) => (
  <motion.div
    whileHover={{ scale: isTaken ? 1 : 1.02 }}
    whileTap={{ scale: isTaken ? 1 : 0.98 }}
    onClick={isTaken ? undefined : onClick}
    className={cn(
      "relative p-4 rounded-xl border-2 transition-all cursor-pointer",
      "bg-gradient-to-br",
      role.bgGradient,
      isSelected && !isTaken && "border-white ring-2 ring-white/30",
      isTaken && "opacity-60 cursor-not-allowed border-gray-600",
      !isSelected && !isTaken && "border-gray-700 hover:border-gray-500"
    )}
  >
    {/* Taken Badge */}
    {isTaken && takenBy && (
      <div className="absolute -top-2 -right-2 px-2 py-1 bg-gray-800 rounded-full text-xs border border-gray-600">
        {takenBy}
      </div>
    )}
    
    <div className="flex items-center gap-3">
      <div className="text-3xl">{role.icon}</div>
      <div>
        <div className={cn("font-bold text-lg", role.color)}>{role.name}</div>
        <div className="text-xs text-gray-400 font-mono">{role.nameEn}</div>
      </div>
    </div>
    
    <div className="mt-3 text-sm text-gray-300">{role.shortDesc}</div>
    
    {isSelected && !isTaken && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-xs text-gray-400 border-t border-gray-700 pt-2"
      >
        {role.description}
      </motion.div>
    )}
  </motion.div>
);

const ParticipantSlot = ({ 
  participant, 
  isMe,
  rank 
}: { 
  participant?: any;
  isMe: boolean;
  rank: number;
}) => {
  const roleConfig = participant ? ROLES.find(r => r.id === participant.role) : null;
  
  return (
    <div className={cn(
      "relative p-3 rounded-lg border-2 transition-all",
      participant ? "border-gray-600 bg-gray-800/50" : "border-dashed border-gray-700 bg-gray-900/30",
      isMe && "ring-2 ring-yellow-500/50"
    )}>
      {/* Rank Badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-xs font-bold">
        {rank}
      </div>
      
      {participant ? (
        <div className="flex items-center gap-2">
          <div className="text-2xl">{roleConfig?.icon || '❓'}</div>
          <div>
            <div className={cn("font-bold text-sm", roleConfig?.color || "text-white")}>
              {participant.playerName || 'Игрок'}
            </div>
            <div className="text-xs text-gray-500">{roleConfig?.name || 'Роль'}</div>
          </div>
          {isMe && (
            <div className="ml-auto text-xs text-yellow-500 font-bold">ВЫ</div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 text-sm py-2">
          Ожидание...
        </div>
      )}
    </div>
  );
};

const QRCodeDisplay = ({ qrUrl, roomCode }: { qrUrl: string; roomCode: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-white p-3 rounded-xl shadow-lg">
      <img 
        src={qrUrl} 
        alt="Scan to join" 
        className="w-40 h-40"
      />
    </div>
    
    <div className="mt-4 text-center">
      <div className="text-xs text-gray-500 uppercase tracking-wider">Код комнаты</div>
      <div className="text-4xl font-mono font-bold tracking-[0.3em] text-cyan-400 mt-1">
        {roomCode}
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT - CREATE LOBBY
// ============================================================================

const CreateLobbyView = ({ onRoomCreated }: { onRoomCreated: (roomId: string) => void }) => {
  const { deviceId } = useDeviceId();
  const createRoom = useMutation(api["coop/rooms"].createRoom);
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreate = async () => {
    if (!deviceId) return;
    setIsCreating(true);
    
    try {
      const result = await createRoom({ deviceId });
      // Используем roomCode для URL, а не roomId
      onRoomCreated(result.roomCode);
    } catch (e) {
      console.error('Failed to create room:', e);
      alert('Ошибка создания комнаты');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Локальный Кооператив
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Играйте вместе на разных устройствах
          </p>
        </div>
        
        {/* Info Card */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
          <h3 className="font-bold text-cyan-400 mb-2">Как это работает?</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">1.</span>
              <span>Создайте комнату и поделитесь кодом</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">2.</span>
              <span>Каждый игрок видит разную информацию</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">3.</span>
              <span>Общайтесь голосом, чтобы победить!</span>
            </li>
          </ul>
        </div>
        
        {/* Role Preview */}
        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Роли</h3>
          {ROLES.map(role => (
            <div 
              key={role.id}
              className={cn(
                "p-3 rounded-lg bg-gradient-to-r",
                role.bgGradient,
                "border border-gray-700"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{role.icon}</span>
                <div>
                  <div className={cn("font-bold", role.color)}>{role.name}</div>
                  <div className="text-xs text-gray-400">{role.shortDesc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Create Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          disabled={isCreating || !deviceId}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg transition-all",
            "bg-gradient-to-r from-cyan-600 to-purple-600",
            "hover:from-cyan-500 hover:to-purple-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg shadow-cyan-900/30"
          )}
        >
          {isCreating ? 'Создание...' : 'Создать Комнату'}
        </motion.button>
        
        {/* Join Option */}
        <div className="mt-4 text-center">
          <span className="text-gray-500">или</span>
        </div>
        
        <JoinByCodeInput />
      </div>
    </div>
  );
};

// ============================================================================
// JOIN BY CODE INPUT
// ============================================================================

const JoinByCodeInput = () => {
  const navigate = useNavigate();
  const { deviceId } = useDeviceId();
  const joinRoom = useMutation(api["coop/rooms"].joinRoom);
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleJoin = async () => {
    if (!deviceId || code.length !== 4) return;
    setIsJoining(true);
    setError(null);
    
    try {
      const result = await joinRoom({ deviceId, roomCode: code.toUpperCase() });
      if (result.success) {
        navigate(`/coop/${code.toUpperCase()}`);
      }
    } catch (e: any) {
      setError(e.message || 'Не удалось присоединиться');
    } finally {
      setIsJoining(false);
    }
  };
  
  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="XXXX"
          maxLength={4}
          className={cn(
            "flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700",
            "text-center font-mono text-2xl tracking-widest uppercase",
            "focus:outline-none focus:border-cyan-500",
            "placeholder:text-gray-600"
          )}
        />
        <button
          onClick={handleJoin}
          disabled={code.length !== 4 || isJoining}
          className={cn(
            "px-6 py-3 rounded-lg font-bold transition-all",
            "bg-gray-700 hover:bg-gray-600",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isJoining ? '...' : 'Войти'}
        </button>
      </div>
      
      {error && (
        <div className="mt-2 text-red-400 text-sm text-center">{error}</div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT - ROOM LOBBY
// ============================================================================

interface RoomLobbyProps {
  roomCode: string;
}

export const RoomLobby = ({ roomCode }: RoomLobbyProps) => {
  const { deviceId } = useDeviceId();
  const navigate = useNavigate();
  
  // Queries
  const room = useQuery(api["coop/rooms"].getRoomByCode, { roomCode });
  const participants = useQuery(
    api["coop/rooms"].getRoomParticipants, 
    room ? { roomId: room._id } : 'skip'
  );
  const joinUrl = useQuery(
    api["coop/rooms"].getRoomJoinUrl,
    room ? { roomId: room._id } : 'skip'
  );
  const mySession = useQuery(
    api["coop/rooms"].getMySession,
    room && deviceId ? { deviceId, roomId: room._id } : 'skip'
  );
  
  // Mutations
  const startBattle = useMutation(api["coop/rooms"].startBattle);
  const leaveRoom = useMutation(api["coop/rooms"].leaveRoom);
  
  // Auto-join if not in room
  const joinRoom = useMutation(api["coop/rooms"].joinRoom);
  
  useEffect(() => {
    if (room && deviceId && mySession === null) {
      // Не в комнате - присоединиться
      joinRoom({ deviceId, roomCode }).catch(console.error);
    }
  }, [room, deviceId, mySession]);
  
  // Redirect to battle if started
  useEffect(() => {
    if (room?.status === 'planning' || room?.status === 'executing') {
      navigate(`/coop/${roomCode}/battle`);
    }
  }, [room?.status, roomCode, navigate]);
  
  const handleStart = async () => {
    if (!room || !deviceId) return;
    try {
      await startBattle({ deviceId, roomId: room._id });
    } catch (e: any) {
      alert(e.message || 'Ошибка запуска');
    }
  };
  
  const handleLeave = async () => {
    if (!room || !deviceId) return;
    try {
      await leaveRoom({ deviceId, roomId: room._id });
      navigate('/coop');
    } catch (e) {
      console.error(e);
    }
  };
  
  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-gray-400">Поиск комнаты {roomCode}...</div>
        </div>
      </div>
    );
  }
  
  const isHost = mySession?.playerId === room.hostId;
  const canStart = (participants?.length || 0) >= 1;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handleLeave}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Выйти
          </button>
          <div className="text-xs text-gray-500">
            {room.status === 'lobby' ? 'Ожидание игроков' : 'В бою'}
          </div>
        </div>
        
        {/* QR & Code */}
        {joinUrl && (
          <div className="mb-8">
            <QRCodeDisplay qrUrl={joinUrl.qrApiUrl} roomCode={room.roomCode} />
          </div>
        )}
        
        {/* Participants */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Отряд ({participants?.length || 0}/3)
          </h3>
          
          <div className="space-y-3">
            {[1, 2, 3].map(rank => {
              const participant = participants?.find(p => p.rank === rank);
              const isMe = participant?.playerId === mySession?.playerId;
              
              return (
                <ParticipantSlot 
                  key={rank}
                  rank={rank}
                  participant={participant}
                  isMe={isMe}
                />
              );
            })}
          </div>
        </div>
        
        {/* My Role Info */}
        {mySession && (
          <div className="mb-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ваша роль</div>
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {ROLES.find(r => r.id === mySession.role)?.icon}
              </div>
              <div>
                <div className={cn(
                  "font-bold text-lg",
                  ROLES.find(r => r.id === mySession.role)?.color
                )}>
                  {mySession.roleName}
                </div>
                <div className="text-xs text-gray-400">
                  {ROLES.find(r => r.id === mySession.role)?.description}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Start Button (Host Only) */}
        {isHost && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg transition-all",
              "bg-gradient-to-r from-green-600 to-emerald-600",
              "hover:from-green-500 hover:to-emerald-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg shadow-green-900/30"
            )}
          >
            Начать Миссию
          </motion.button>
        )}
        
        {!isHost && (
          <div className="text-center text-gray-400 py-4">
            Ожидание запуска от хоста...
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-8 p-4 rounded-xl bg-cyan-900/20 border border-cyan-800/30">
          <div className="text-cyan-400 font-bold text-sm mb-2">💡 Совет</div>
          <div className="text-sm text-gray-300">
            Общайтесь голосом! Каждый видит только часть информации. 
            Только вместе вы соберёте полную картину боя.
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const CoopLobby = () => {
  const navigate = useNavigate();
  
  const handleRoomCreated = (roomCode: string) => {
    // Перенаправляем на страницу лобби с кодом комнаты
    navigate(`/coop/${roomCode}`);
  };
  
  return <CreateLobbyView onRoomCreated={handleRoomCreated} />;
};

export default CoopLobby;

