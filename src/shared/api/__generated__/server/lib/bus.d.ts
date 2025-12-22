import { EventEmitter } from 'events';
export declare const eventBus: EventEmitter<[never]>;
export type CoopEvent = {
    type: 'room_update';
    roomId: string;
    data: any;
};
export declare function broadcastCoopUpdate(roomId: string, data: any): void;
