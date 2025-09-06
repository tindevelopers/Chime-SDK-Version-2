"use client";

import React, { useEffect, useRef, useState } from 'react';
import { VideoTileState } from 'amazon-chime-sdk-js';
import { useChime } from './ChimeProvider';

interface VideoTileProps {
  tileId: number;
  isLocal?: boolean;
  attendeeId?: string;
  className?: string;
}

const VideoTile: React.FC<VideoTileProps> = ({ 
  tileId, 
  isLocal = false, 
  attendeeId, 
  className = "" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { audioVideo } = useChime();

  useEffect(() => {
    if (audioVideo && videoRef.current) {
      audioVideo.bindVideoElement(tileId, videoRef.current);
      console.log(`🎥 Bound video tile ${tileId} to video element`);
    }

    return () => {
      if (audioVideo && videoRef.current) {
        audioVideo.unbindVideoElement(tileId);
        console.log(`🎥 Unbound video tile ${tileId}`);
      }
    };
  }, [audioVideo, tileId]);

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted={isLocal} // Mute local video to prevent echo
        playsInline
      />
      
      {/* Attendee label */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {isLocal ? 'You' : `Participant ${attendeeId?.slice(-4) || 'Unknown'}`}
      </div>
      
      {/* Local video indicator */}
      {isLocal && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          Local
        </div>
      )}
    </div>
  );
};

export const VideoGrid: React.FC = () => {
  const { audioVideo } = useChime();
  const [videoTiles, setVideoTiles] = useState<VideoTileState[]>([]);

  useEffect(() => {
    if (!audioVideo) return;

    const observer = {
      videoTileDidUpdate: (tileState: VideoTileState) => {
        console.log('🎥 Video tile did update:', tileState);
        
        setVideoTiles(prevTiles => {
          const existingIndex = prevTiles.findIndex(tile => tile.tileId === tileState.tileId);
          
          if (existingIndex >= 0) {
            // Update existing tile
            const newTiles = [...prevTiles];
            newTiles[existingIndex] = tileState;
            return newTiles;
          } else {
            // Add new tile
            return [...prevTiles, tileState];
          }
        });
      },
      
      videoTileWasRemoved: (tileId: number) => {
        console.log('🎥 Video tile was removed:', tileId);
        setVideoTiles(prevTiles => prevTiles.filter(tile => tile.tileId !== tileId));
      }
    };

    audioVideo.addObserver(observer);

    return () => {
      audioVideo.removeObserver(observer);
    };
  }, [audioVideo]);

  const getGridClassName = () => {
    const tileCount = videoTiles.length;
    if (tileCount === 1) return "grid-cols-1";
    if (tileCount === 2) return "grid-cols-2";
    if (tileCount <= 4) return "grid-cols-2 grid-rows-2";
    if (tileCount <= 6) return "grid-cols-3 grid-rows-2";
    return "grid-cols-3 grid-rows-3";
  };

  if (videoTiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📹</div>
          <h3 className="text-xl font-semibold mb-2">No video streams</h3>
          <p>Waiting for participants to join with video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 grid gap-2 p-4 ${getGridClassName()}`}>
      {videoTiles
        .filter((tile) => tile.tileId !== null)
        .map((tile) => (
          <VideoTile
            key={tile.tileId}
            tileId={tile.tileId!}
            isLocal={tile.localTile}
            attendeeId={tile.boundAttendeeId || undefined}
            className="min-h-[200px]"
          />
        ))}
    </div>
  );
};
