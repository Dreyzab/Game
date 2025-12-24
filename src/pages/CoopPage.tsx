import React from 'react';
import { useCoopStore, CoopLobby } from '@/features/coop';
import { CoopVisualNovelPage } from './CoopVisualNovelPage';
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner';

const CoopPage: React.FC = () => {
  const { room, isLoading } = useCoopStore();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    );
  }

  if (activeGame(room)) {
    return <CoopVisualNovelPage />;
  }

  return <CoopLobby />;
}

function activeGame(room: any) {
  return room && room.status === 'active';
}

export default CoopPage;
