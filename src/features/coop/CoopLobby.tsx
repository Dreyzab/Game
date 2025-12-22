import React, { useState, useEffect } from 'react';
import { useCoopStore } from './model/store';
import { Button } from '@/shared/ui/components/Button';
import { Heading } from '@/shared/ui/components/Heading';
import { Text } from '@/shared/ui/components/Text';
import { Badge } from '@/shared/ui/components/Badge';
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner';
import { COOP_ROLES } from '@/shared/types/coop';
import { cn } from '@/shared/lib/utils/cn';
import { useMyPlayer } from '@/shared/hooks/useMyPlayer';
import { useNavigate } from 'react-router-dom';

export const CoopLobby: React.FC = () => {
  const { room, isLoading, error, createRoom, joinRoom, leaveRoom, setReady, startGame } = useCoopStore();
  const myPlayerQuery = useMyPlayer();
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('valkyrie');
  const navigate = useNavigate();

  // Redirect if game starts
  useEffect(() => {
    if (room?.status === 'active') {
      navigate(`/coop/${room.code}`);
    }
  }, [room?.code, room?.status, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (room) {
    const myId = (myPlayerQuery.data as any)?.player?.id as number | undefined;
    const myParticipant = myId ? room.participants.find((p) => p.id === myId) : undefined;
    const isMeReady = Boolean(myParticipant?.ready);
    const amHost = Boolean(myId && room.hostId === myId);

    // Lobby View
    // const amHost = room.hostId === room.participants.find(p => p.id === room.hostId)?.id; 
    // Simplified: Host check logic can be added later if needed for Start Button visibility.
    // Wait, room.hostId is a number. I need my own ID.
    // Ideally store should expose `myId` or I get it from Auth.
    // For MVP, just show Start button if I am host. 
    // Actually, I don't know my ID easily here without Auth store.
    // Let's assume everyone sees the button but backend blocks it? Or just show "Waiting for host".
    // Better: Check if *I* am the host.
    // I'll skip "Am I Host" check for UI hiding for a sec, just let backend handle auth error?
    // Or I decode token.

    return (
      <div className="min-h-screen bg-black/90 text-white p-8 flex flex-col items-center">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <Heading level={1} className="text-4xl text-cyan-400">Lobby: {room.code}</Heading>
            <Text className="text-gray-400">Waiting for players...</Text>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 space-y-4">
            <Heading level={3}>Participants ({room.participants.length}/4)</Heading>
            <div className="space-y-2">
              {room.participants.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                      {p.name[0]}
                    </div>
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-cyan-500 uppercase">
                        {p.role ? (COOP_ROLES as any)[p.role]?.label ?? p.role : '—'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={p.ready ? 'glow' : 'outline'}>
                    {p.ready ? 'READY' : 'WAITING'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => leaveRoom()}>
              Leave
            </Button>
            <Button
              variant="primary"
              onClick={() => setReady(!isMeReady)}
              disabled={!myId}
            >
              {isMeReady ? 'Unready' : 'Ready Up'}
            </Button>
            {amHost ? (
              <Button variant="secondary" onClick={() => startGame()}>
                Start Game
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                Waiting for host
              </Button>
            )}
          </div>
          {error && <div className="text-red-500 text-center">{error}</div>}
        </div>
      </div>
    );
  }

  // Menu View
  return (
    <div className="min-h-screen bg-black/95 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <Heading level={1} className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            CO-OP
          </Heading>
          <Text className="text-gray-400">Cooperative Narrative Experience</Text>
        </div>

        {mode === 'menu' && (
          <div className="space-y-4 p-6 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(COOP_ROLES).map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "p-2 rounded border text-sm transition-all",
                      selectedRole === role.id
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                        : "border-gray-700 hover:border-gray-600 text-gray-500"
                    )}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <Button variant="primary" size="lg" onClick={() => createRoom(selectedRole)}>
                Create Room
              </Button>
              <Button variant="outline" size="lg" onClick={() => setMode('join')}>
                Join Room
              </Button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4 p-6 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl">
            <div className="space-y-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="w-full bg-black border border-gray-700 rounded p-4 text-center text-2xl font-mono tracking-widest focus:border-cyan-500 outline-none transition-colors"
                maxLength={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(COOP_ROLES).map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "p-2 rounded border text-sm transition-all",
                      selectedRole === role.id
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                        : "border-gray-700 hover:border-gray-600 text-gray-500"
                    )}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <Button variant="primary" size="lg" onClick={() => joinRoom(joinCode, selectedRole)} disabled={joinCode.length < 4}>
                Join
              </Button>
              <Button variant="ghost" onClick={() => setMode('menu')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-center text-sm">{error}</div>}
      </div>
    </div>
  );
}
