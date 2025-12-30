/**
 * Coop Feature Module
 * 
 * Local Co-op on Separate Devices (LCSD) implementation
 */

export { CoopLobby } from './CoopLobby';
export { CoopBattleScreen } from './CoopBattleScreen';
export { useCoopStore } from './model/store';
export { clearLastCoopRoomCode, getLastCoopRoomCode, setLastCoopRoomCode } from './model/persistence';

// UI helpers (re-export to avoid deep imports into feature internals)
export { ScoreFeedback } from './ui/ScoreFeedback';
export { ExpeditionFeedback } from './ui/ExpeditionFeedback';










