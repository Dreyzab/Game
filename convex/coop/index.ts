/**
 * COOP Module - Local Co-op on Separate Devices (LCSD)
 * 
 * Экспорт всех функций кооперативного модуля
 */

// Rooms - создание и управление комнатами
export {
  createRoom,
  joinRoom,
  leaveRoom,
  startBattle,
  getRoomByCode,
  getRoom,
  getRoomParticipants,
  getRoomJoinUrl,
  getMySession,
  getRoleInfo,
  getOpenRooms,
  cleanupExpiredRooms,
} from "./rooms";

// Actions - система ходов WeGo (Commit-Reveal)
export {
  commitAction,
  cancelAction,
  resolveRound,
  contributeCard,
  acceptContribution,
  getRoundActions,
  getReadyStatus,
  getCardPoolContributions,
} from "./coopActions";

// Presence - heartbeat и дисконнекты
export {
  sendHeartbeat,
  updateIntent,
  disconnect,
  nudgePlayer,
  getRoomPresence,
  getTeammateIntents,
  checkAllConnected,
  checkDisconnects,
  handleReconnect,
} from "./presence";

// Asymmetry - фильтрация по ролям
export {
  getFilteredGameState,
  getWhatToAsk,
  generateVoiceComment,
} from "./asymmetry";


