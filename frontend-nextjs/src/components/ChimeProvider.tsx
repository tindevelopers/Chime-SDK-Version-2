"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  DefaultMeetingSession,
  MeetingSession,
  ConsoleLogger,
  LogLevel,
  DefaultDeviceController,
  MeetingSessionConfiguration,
  AudioVideoFacade,
  MeetingSessionStatusCode,
  VideoTileState,
  AudioVideoObserver,
  MeetingSessionStatus,
  Device,
} from 'amazon-chime-sdk-js';

interface ChimeContextType {
  meetingSession: MeetingSession | null;
  audioVideo: AudioVideoFacade | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  isDeviceControllerReady: boolean;
  audioInputDevices: Device[];
  videoInputDevices: Device[];
  audioOutputDevices: Device[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  joinMeeting: (meetingData: any, attendeeData: any, preSelectedDevices?: {
    audioInput: Device;
    videoInput: Device;
    audioOutput: Device;
  }) => Promise<void>;
  leaveMeeting: () => void;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  selectAudioInputDevice: (deviceId: string) => Promise<void>;
  selectVideoInputDevice: (deviceId: string) => Promise<void>;
  selectAudioOutputDevice: (deviceId: string) => Promise<void>;
  startLocalVideo: () => Promise<void>;
  stopLocalVideo: () => void;
  updateDeviceLists: () => Promise<void>;
  startVideoPreviewForDevice: (element: HTMLVideoElement, deviceId: string) => Promise<void>;
  stopVideoPreview: (element: HTMLVideoElement) => Promise<void>;
  initializeWithDevices: (devices: {
    audioInput: Device;
    videoInput: Device;
    audioOutput: Device;
  }) => Promise<void>;
}

const ChimeContext = createContext<ChimeContextType | undefined>(undefined);

export const useChime = () => {
  const context = useContext(ChimeContext);
  if (!context) {
    throw new Error('useChime must be used within a ChimeProvider');
  }
  return context;
};

interface ChimeProviderProps {
  children: React.ReactNode;
}

export const ChimeProvider: React.FC<ChimeProviderProps> = ({ children }) => {
  const [meetingSession, setMeetingSession] = useState<MeetingSession | null>(null);
  const [audioVideo, setAudioVideo] = useState<AudioVideoFacade | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeviceControllerReady, setIsDeviceControllerReady] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState<Device[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<Device[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<Device[]>([]);
  
  // Store currently selected devices
  const [selectedAudioInput, setSelectedAudioInput] = useState<Device | null>(null);
  const [selectedVideoInput, setSelectedVideoInput] = useState<Device | null>(null);
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<Device | null>(null);
  
  const deviceController = useRef<DefaultDeviceController | null>(null);
  const logger = useRef<ConsoleLogger | null>(null);

  useEffect(() => {
    // Initialize logger and device controller
    logger.current = new ConsoleLogger('ChimeMeetingLogs', LogLevel.INFO);
    
    const initializeDeviceController = async () => {
      try {
        console.log('🔄 Initializing device controller...');
        
        // Create device controller
        deviceController.current = new DefaultDeviceController(logger.current!);
        
        // Request permissions and initialize devices
        console.log('🔄 Requesting media permissions...');
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          console.log('✅ Media permissions granted');
        } catch {
          console.warn('⚠️ Media permissions denied, trying audio only...');
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ Audio permission granted');
          } catch (audioError) {
            console.error('❌ No media permissions:', audioError);
            throw new Error('Media permissions required');
          }
        }
        
        // Wait for device controller to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Load available devices
        console.log('🔄 Loading devices...');
        await loadDevices();
        
        // Additional wait to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mark device controller as ready
        setIsDeviceControllerReady(true);
        console.log('✅ Device controller fully initialized and ready');
      } catch (err) {
        console.error('❌ Failed to initialize device controller:', err);
        setError('Failed to initialize device controller. Please allow camera and microphone access and refresh the page.');
        setIsDeviceControllerReady(false);
      }
    };

    initializeDeviceController();

    return () => {
      // Cleanup device controller on unmount
      if (deviceController.current) {
        try {
          deviceController.current.destroy();
        } catch (e) {
          console.warn('Error destroying device controller:', e);
        }
        deviceController.current = null;
      }
    };
  }, []);

  const loadDevices = async () => {
    if (!deviceController.current) {
      console.warn('Device controller not available');
      return;
    }

    try {
      console.log('🔄 Loading audio/video devices...');
      
      // Try multiple times with delay - sometimes devices aren't immediately available
      let attempts = 0;
      let audioInputs: Device[] = [];
      let videoInputs: Device[] = [];
      let audioOutputs: Device[] = [];
      
      while (attempts < 3) {
        try {
          audioInputs = await deviceController.current.listAudioInputDevices();
          videoInputs = await deviceController.current.listVideoInputDevices();
          audioOutputs = await deviceController.current.listAudioOutputDevices();
          break; // Success
        } catch (deviceError) {
          console.warn(`Device listing attempt ${attempts + 1} failed:`, deviceError);
          if (attempts < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          attempts++;
        }
      }
      
      console.log('📱 Devices found:', {
        audioInputs: audioInputs.length,
        videoInputs: videoInputs.length,
        audioOutputs: audioOutputs.length
      });
      
      setAudioInputDevices(audioInputs);
      setVideoInputDevices(videoInputs);
      setAudioOutputDevices(audioOutputs);
      
    } catch (err) {
      console.error('❌ Error loading devices after all attempts:', err);
      setError('Failed to load audio/video devices. Please check permissions.');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const joinMeeting = async (meetingData: any, attendeeData: any, preSelectedDevices?: {
    audioInput: Device;
    videoInput: Device;
    audioOutput: Device;
  }) => {
    console.log('🎥 Join meeting requested...', { 
      deviceControllerReady: isDeviceControllerReady,
      meetingId: meetingData?.MeetingId,
      attendeeId: attendeeData?.AttendeeId,
      hasPreSelectedDevices: !!preSelectedDevices
    });
    
    // If we have pre-selected devices, use them to initialize the device controller
    if (preSelectedDevices && !isDeviceControllerReady) {
      console.log('🔄 Initializing with pre-selected devices...');
      await initializeWithDevices(preSelectedDevices);
    }
    
    // Wait for device controller to be ready with shorter timeout since devices are pre-tested
    if (!isDeviceControllerReady) {
      console.log('⏳ Device controller not ready yet, waiting...');
      setError('Initializing with your selected devices...');
      
      // Wait up to 5 seconds for device controller to be ready (shorter since devices are pre-tested)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds (50 * 100ms)
      
      while (!isDeviceControllerReady && attempts < maxAttempts) {
        const secondsElapsed = Math.floor(attempts / 10);
        if (attempts % 10 === 0) { // Update every second
          setError(`Initializing devices... (${secondsElapsed}s)`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!isDeviceControllerReady) {
        setError('Device initialization failed. Please check your device setup and try again.');
        return;
      }
    }

    if (!deviceController.current || !logger.current) {
      setError('Device controller not properly initialized');
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log('✅ Device controller ready, proceeding with meeting join...');

    try {
      console.log('🎥 Creating ChimeSDK meeting session...');

      // Create meeting session configuration
      const configuration = new MeetingSessionConfiguration(meetingData, attendeeData);
      
      // Create meeting session with unique instance
      const session = new DefaultMeetingSession(
        configuration,
        logger.current,
        deviceController.current
      );

      // Get audio-video controller
      const av = session.audioVideo;
      
      // Add observers with improved handling for multi-user scenarios
      const observer: AudioVideoObserver = {
        audioVideoDidStart: () => {
          console.log('✅ Audio-video session started successfully');
          setIsLoading(false);
        },
        audioVideoDidStop: (sessionStatus: MeetingSessionStatus) => {
          const statusCode = sessionStatus.statusCode();
          console.log('📞 Audio-video stopped with status:', statusCode, MeetingSessionStatusCode[statusCode]);
          
          // Critical: Don't disconnect users when others join the same meeting
          if (statusCode === MeetingSessionStatusCode.AudioJoinedFromAnotherDevice) {
            console.log('ℹ️ Another participant joined - this is normal, staying connected');
            return; // Don't change any state, keep the user connected
          }
          
          // Handle normal disconnection scenarios
          if (statusCode === MeetingSessionStatusCode.Left) {
            console.log('👋 User intentionally left the meeting');
          } else if (statusCode === MeetingSessionStatusCode.OK) {
            console.log('✅ Meeting ended normally');
          } else {
            console.log('❌ Meeting ended unexpectedly:', statusCode);
            setError(`Connection lost: ${MeetingSessionStatusCode[statusCode] || statusCode}`);
          }
          
          // Clean up session state for actual disconnections
          setIsLoading(false);
          setIsVideoEnabled(false);
          setIsAudioEnabled(false);
          setMeetingSession(null);
          setAudioVideo(null);
        },
        videoTileDidUpdate: (tileState: VideoTileState) => {
          console.log('🎥 Video tile update:', {
            tileId: tileState.tileId,
            attendeeId: tileState.boundAttendeeId,
            isLocal: tileState.localTile,
            active: tileState.active,
            paused: tileState.paused
          });
          
          // Only handle active, non-paused tiles
          if (tileState.active && !tileState.paused && tileState.tileId) {
            console.log(`🎥 Video tile ${tileState.tileId} is active and ready`);
          }
        },
        videoTileWasRemoved: (tileId: number) => {
          console.log(`🎥 Video tile removed: ${tileId}`);
        }
      };

      av.addObserver(observer);

      // Ensure we have devices loaded before starting audio
      console.log('🔄 Ensuring devices are loaded...');
      let deviceLoadAttempts = 0;
      while ((audioInputDevices.length === 0 || videoInputDevices.length === 0) && deviceLoadAttempts < 5) {
        console.log(`Device load attempt ${deviceLoadAttempts + 1}...`);
        await loadDevices();
        if (audioInputDevices.length === 0 || videoInputDevices.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        deviceLoadAttempts++;
      }

      // Use pre-selected devices or fall back to first available device
      const audioDevice = preSelectedDevices?.audioInput || selectedAudioInput || (audioInputDevices.length > 0 ? audioInputDevices[0] : null);
      const videoDevice = preSelectedDevices?.videoInput || selectedVideoInput || (videoInputDevices.length > 0 ? videoInputDevices[0] : null);
      
      // Store selected devices for future reference
      if (preSelectedDevices) {
        setSelectedAudioInput(preSelectedDevices.audioInput);
        setSelectedVideoInput(preSelectedDevices.videoInput);
        setSelectedAudioOutput(preSelectedDevices.audioOutput);
      }
      
      // Start audio input with the selected device
      if (audioDevice) {
        console.log('🎤 Starting audio input with selected device...');
        try {
          await av.startAudioInput(audioDevice);
          console.log('✅ Audio input started with device:', audioDevice);
        } catch (audioError) {
          console.warn('⚠️ Failed to start audio input:', audioError);
          // Continue anyway - user might be able to enable audio later
        }
      } else {
        console.warn('⚠️ No audio input device available');
      }

      // Start the meeting session
      console.log('🚀 Starting audio-video session...');
      av.start();
      
      // Store session references
      setMeetingSession(session);
      setAudioVideo(av);
      setIsAudioEnabled(!!audioDevice);

      // Auto-start video with selected device
      if (videoDevice) {
        try {
          console.log('📹 Auto-starting video with selected device...');
          await av.startVideoInput(videoDevice);
          
          // Wait a moment for the video input to be ready, then start local tile
          setTimeout(() => {
            av.startLocalVideoTile();
            setIsVideoEnabled(true);
            console.log('✅ Video started successfully with device:', videoDevice);
          }, 200);
        } catch (videoError) {
          console.warn('⚠️ Failed to auto-start video:', videoError);
          // Video can be started manually later
        }
      }

      console.log('✅ Successfully joined meeting with enhanced multi-user support');
      
    } catch (err) {
      console.error('❌ Error joining meeting:', err);
      setError(`Failed to join meeting: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const leaveMeeting = useCallback(async () => {
    try {
      console.log('🚪 Leaving meeting...');
      
      if (audioVideo) {
        try {
          // Stop local video tile first
          if (isVideoEnabled) {
            console.log('📹 Stopping local video...');
            audioVideo.stopLocalVideoTile();
          }
          
          // Stop audio input
          if (isAudioEnabled) {
            console.log('🎤 Stopping audio input...');
            await audioVideo.stopAudioInput();
          }
          
          // Stop video input
          console.log('📹 Stopping video input...');
          await audioVideo.stopVideoInput();
          
          // Gracefully stop the session
          console.log('🛑 Stopping audio-video session...');
          audioVideo.stop();
          
        } catch (stopError) {
          console.warn('⚠️ Error during graceful shutdown:', stopError);
          // Continue with cleanup even if stop fails
        }
      }
      
      // Clean up all state
      setMeetingSession(null);
      setAudioVideo(null);
      setIsVideoEnabled(false);
      setIsAudioEnabled(false);
      setIsMuted(false);
      setIsLoading(false);
      setError(null);
      
      console.log('✅ Successfully left meeting and cleaned up');
    } catch (err) {
      console.error('❌ Error leaving meeting:', err);
      // Force cleanup even on error
      setMeetingSession(null);
      setAudioVideo(null);
      setIsVideoEnabled(false);
      setIsAudioEnabled(false);
      setIsMuted(false);
      setIsLoading(false);
    }
  }, [audioVideo, isVideoEnabled, isAudioEnabled]);

  const toggleVideo = async () => {
    if (!audioVideo || !videoInputDevices.length) return;

    try {
      if (isVideoEnabled) {
        audioVideo.stopLocalVideoTile();
        setIsVideoEnabled(false);
        console.log('📹 Video disabled');
      } else {
        // Use the selected video device, not just the first one
        const deviceToUse = selectedVideoInput || videoInputDevices[0];
        console.log('📹 Toggle video: Starting video input with device:', deviceToUse);
        await audioVideo.startVideoInput(deviceToUse);
        console.log('📹 Toggle video: Starting local video tile...');
        audioVideo.startLocalVideoTile();
        setIsVideoEnabled(true);
        console.log('📹 Video enabled with device:', deviceToUse);
      }
    } catch (err) {
      console.error('Error toggling video:', err);
      setError('Failed to toggle video');
    }
  };

  const toggleAudio = async () => {
    if (!audioVideo) return;

    try {
      if (isMuted) {
        audioVideo.realtimeUnmuteLocalAudio();
        setIsMuted(false);
        console.log('🔊 Audio unmuted');
      } else {
        audioVideo.realtimeMuteLocalAudio();
        setIsMuted(true);
        console.log('🔇 Audio muted');
      }
    } catch (err) {
      console.error('Error toggling audio:', err);
      setError('Failed to toggle audio');
    }
  };

  const selectAudioInputDevice = async (deviceId: string) => {
    if (!audioVideo) return;
    try {
      const device = audioInputDevices.find(d => 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d as any).deviceId === deviceId
      );
      if (device) {
        await audioVideo.startAudioInput(device);
        console.log('🎤 Audio input device changed:', device);
        
        // Save updated device preference (by id only)
        const savedPrefs = JSON.parse(localStorage.getItem('chime-device-preferences') || '{}');
        savedPrefs.audioInputId = deviceId;
        savedPrefs.timestamp = Date.now();
        localStorage.setItem('chime-device-preferences', JSON.stringify(savedPrefs));
      }
    } catch (err) {
      console.error('Error selecting audio input device:', err);
      setError('Failed to change microphone');
    }
  };

  const selectVideoInputDevice = async (deviceId: string) => {
    if (!audioVideo) return;
    try {
      const device = videoInputDevices.find(d => 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d as any).deviceId === deviceId
      );
      if (device) {
        await audioVideo.startVideoInput(device);
        console.log('📹 Video input device changed:', device);
        
        // Save updated device preference (by id only)
        const savedPrefs = JSON.parse(localStorage.getItem('chime-device-preferences') || '{}');
        savedPrefs.videoInputId = deviceId;
        savedPrefs.timestamp = Date.now();
        localStorage.setItem('chime-device-preferences', JSON.stringify(savedPrefs));
      }
    } catch (err) {
      console.error('Error selecting video input device:', err);
      setError('Failed to change camera');
    }
  };

  const selectAudioOutputDevice = async (deviceId: string) => {
    if (!audioVideo) return;
    try {
      const device = audioOutputDevices.find(d => 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d as any).deviceId === deviceId
      );
      if (device) {
        // Create an audio element and set the output device
        const audioElement = document.createElement('audio');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((audioElement as any).setSinkId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (audioElement as any).setSinkId(deviceId);
        }
        await audioVideo.bindAudioElement(audioElement);
        console.log('🔊 Audio output device changed:', device);
        
        // Save updated device preference (by id only)
        const savedPrefs = JSON.parse(localStorage.getItem('chime-device-preferences') || '{}');
        savedPrefs.audioOutputId = deviceId;
        savedPrefs.timestamp = Date.now();
        localStorage.setItem('chime-device-preferences', JSON.stringify(savedPrefs));
      }
    } catch (err) {
      console.error('Error selecting audio output device:', err);
      setError('Failed to change speakers');
    }
  };

  const startVideoPreviewForDevice = async (element: HTMLVideoElement, deviceId: string) => {
    if (!deviceController.current) return;
    try {
      const device = videoInputDevices.find(d =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d as any).deviceId === deviceId
      );
      if (!device) return;
      try {
        await deviceController.current.stopVideoPreviewForVideoInput(element);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch {
        // ignore
      }
      await deviceController.current.startVideoInput(device);
      await deviceController.current.startVideoPreviewForVideoInput(element);
    } catch (e) {
      console.warn('Preview start failed:', e);
    }
  };

  const stopVideoPreview = async (element: HTMLVideoElement) => {
    if (!deviceController.current) return;
    try {
      await deviceController.current.stopVideoPreviewForVideoInput(element);
    } catch {
      // ignore
    }
  };

  const startLocalVideo = async () => {
    if (!audioVideo || !videoInputDevices.length) return;
    try {
      await audioVideo.startVideoInput(videoInputDevices[0]);
      audioVideo.startLocalVideoTile();
      setIsVideoEnabled(true);
    } catch (err) {
      console.error('Error starting local video:', err);
    }
  };

  const stopLocalVideo = () => {
    if (!audioVideo) return;
    audioVideo.stopLocalVideoTile();
    setIsVideoEnabled(false);
  };

  const initializeWithDevices = async (devices: {
    audioInput: Device;
    videoInput: Device;
    audioOutput: Device;
  }) => {
    try {
      console.log('🔄 Initializing device controller with pre-selected devices...');
      setError('');
      
      // Create logger and device controller if not already created
      if (!logger.current) {
        logger.current = new ConsoleLogger('ChimeMeetingLogs', LogLevel.INFO);
      }
      
      if (!deviceController.current) {
        deviceController.current = new DefaultDeviceController(logger.current);
      }
      
      // Set the devices directly
      setAudioInputDevices([devices.audioInput]);
      setVideoInputDevices([devices.videoInput]);
      setAudioOutputDevices([devices.audioOutput]);
      
      // Mark as ready immediately since devices are pre-tested
      setIsDeviceControllerReady(true);
      
      console.log('✅ Device controller initialized with pre-selected devices');
      
    } catch (err) {
      console.error('❌ Failed to initialize with pre-selected devices:', err);
      setError('Failed to initialize with selected devices. Please try device setup again.');
      setIsDeviceControllerReady(false);
      throw err;
    }
  };

  const value: ChimeContextType = {
    meetingSession,
    audioVideo,
    isVideoEnabled,
    isAudioEnabled,
    isMuted,
    isLoading,
    error,
    isDeviceControllerReady,
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    joinMeeting,
    leaveMeeting,
    toggleVideo,
    toggleAudio,
    selectAudioInputDevice,
    selectVideoInputDevice,
    selectAudioOutputDevice,
    startLocalVideo,
    stopLocalVideo,
    updateDeviceLists: loadDevices,
    startVideoPreviewForDevice,
    stopVideoPreview,
    initializeWithDevices,
  };

  return (
    <ChimeContext.Provider value={value}>
      {children}
    </ChimeContext.Provider>
  );
};
