"use client";

import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Settings,
  Monitor,
  MonitorOff,
  Users,
  MessageSquare
} from 'lucide-react';
import { useChime } from './ChimeProvider';

export const MeetingControls: React.FC = () => {
  const {
    isVideoEnabled,
    isAudioEnabled,
    isMuted,
    isLoading,
    error,
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    audioVideo,
    leaveMeeting,
    toggleVideo,
    toggleAudio,
    selectAudioInputDevice,
    selectVideoInputDevice,
    selectAudioOutputDevice,
  } = useChime();

  const [showSettings, setShowSettings] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const handleLeave = () => {
    if (confirm('Are you sure you want to leave the meeting?')) {
      leaveMeeting();
      // Navigate back to dashboard
      window.location.href = '/';
    }
  };

  const toggleScreenShare = async () => {
    if (!audioVideo) {
      console.error('AudioVideo not available for screen sharing');
      return;
    }

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        console.log('🛑 Stopping screen share...');
        await audioVideo.stopContentShare();
        setIsScreenSharing(false);
        console.log('✅ Screen sharing stopped');
      } else {
        // Start screen sharing
        console.log('🖥️ Starting screen share...');
        
        // Get screen media stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true // Include system audio if possible
        });
        
        // Start content share
        await audioVideo.startContentShare(screenStream);
        setIsScreenSharing(true);
        console.log('✅ Screen sharing started');
        
        // Listen for the user clicking "Stop sharing" in the browser
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          console.log('🛑 User stopped screen sharing from browser');
          setIsScreenSharing(false);
          audioVideo.stopContentShare();
        });
      }
    } catch (err) {
      console.error('❌ Error toggling screen share:', err);
      setIsScreenSharing(false);
      // Don't show error to user since they might have just cancelled the screen share dialog
    }
  };

  return (
    <div className="bg-gray-800 text-white p-4">
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Main controls */}
      <div className="flex items-center justify-center space-x-4">
        {/* Microphone */}
        <button
          onClick={toggleAudio}
          disabled={isLoading}
          className={`p-3 rounded-full transition-colors ${
            isMuted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-600 hover:bg-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        {/* Video */}
        <button
          onClick={toggleVideo}
          disabled={isLoading}
          className={`p-3 rounded-full transition-colors ${
            !isVideoEnabled
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-600 hover:bg-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isVideoEnabled ? 'Stop video' : 'Start video'}
        >
          {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          disabled={isLoading}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-600 hover:bg-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
          title="Settings"
        >
          <Settings className="h-6 w-6" />
        </button>

        {/* Leave Meeting */}
        <button
          onClick={handleLeave}
          className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          title="Leave meeting"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>

      {/* Device Settings Panel */}
      {showSettings && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Device Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Audio Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Microphone</label>
              <select
                onChange={(e) => selectAudioInputDevice(e.target.value)}
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
              >
                <option value="">Select microphone...</option>
                {audioInputDevices.map((device, index) => (
                  <option key={`audio-input-${index}`} value={(device as any).deviceId || device}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    {(device as any).label || `Microphone ${index + 1}`} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </option>
                ))}
              </select>
            </div>

            {/* Video Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Camera</label>
              <select
                onChange={(e) => selectVideoInputDevice(e.target.value)}
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
              >
                <option value="">Select camera...</option>
                {videoInputDevices.map((device, index) => (
                  <option key={`video-input-${index}`} value={(device as any).deviceId || device}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    {(device as any).label || `Camera ${index + 1}`} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </option>
                ))}
              </select>
            </div>

            {/* Audio Output */}
            <div>
              <label className="block text-sm font-medium mb-2">Speaker</label>
              <select
                onChange={(e) => selectAudioOutputDevice(e.target.value)}
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
              >
                <option value="">Select speaker...</option>
                {audioOutputDevices.map((device, index) => (
                  <option key={`audio-output-${index}`} value={(device as any).deviceId || device}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    {(device as any).label || `Speaker ${index + 1}`} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Status indicators */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-300">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Audio {isAudioEnabled ? (isMuted ? '(Muted)' : '(Active)') : '(Off)'}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isVideoEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Video {isVideoEnabled ? '(Active)' : '(Off)'}</span>
        </div>

        {isLoading && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span>Connecting...</span>
          </div>
        )}
      </div>
    </div>
  );
};
