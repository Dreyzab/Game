import { EventEmitter } from 'events';

export const eventBus = new EventEmitter();

export type CoopEvent = {
    type: 'room_update';
    roomId: string;
    data: any;
};

export function broadcastCoopUpdate(roomId: string, data: any) {
    eventBus.emit('coop_update', { roomId, data });
}
