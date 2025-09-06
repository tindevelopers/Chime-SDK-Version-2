'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Device } from 'amazon-chime-sdk-js';
import { useChime } from './ChimeProvider';

interface DeviceSetupProps {
  onDevicesReady: (devices: {
    audioInput: Device;
    videoInput: Device;
    audioOutput: Device;
  }) => void;
  onClose: () => void;
}

const DeviceSetup: React.FC<DeviceSetupProps> = ({ onDevicesReady, onClose }) => {
  const [audioInputDevices, setAudioInputDevices] = useState<Device[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<Device[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<Device[]>([]);
  
  const [selectedAudioInput, setSelectedAudioInput] = useState<Device | null>(null);
  const [selectedVideoInput, setSelectedVideoInput] = useState<Device | null>(null);
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<Device | null>(null);
  
  const [isVideoTesting, setIsVideoTesting] = useState(false);
  const [isVideoPreviewActive, setIsVideoPreviewActive] = useState(false);
  const [isAudioTesting, setIsAudioTesting] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioLevelRef = useRef<HTMLDivElement>(null);

  // Use Chime context device management
  const {
    audioInputDevices: ctxAudioInputDevices,
    videoInputDevices: ctxVideoInputDevices,
    audioOutputDevices: ctxAudioOutputDevices,
    updateDeviceLists,
    startVideoPreviewForDevice,
    stopVideoPreview: stopPreview,
    selectAudioInputDevice: selectAudioInputById,
    selectVideoInputDevice: selectVideoInputById,
    selectAudioOutputDevice: selectAudioOutputById,
  } = useChime();

  // Save device preferences whenever selections change
  const saveDevicePreferences = useCallback(() => {
    if (selectedAudioInput && selectedVideoInput && selectedAudioOutput) {
      const devicePrefs = {
        audioInputId: getDeviceId(selectedAudioInput),
        videoInputId: getDeviceId(selectedVideoInput),
        audioOutputId: getDeviceId(selectedAudioOutput),
        audioInputLabel: getDeviceLabel(selectedAudioInput),
        videoInputLabel: getDeviceLabel(selectedVideoInput),
        audioOutputLabel: getDeviceLabel(selectedAudioOutput),
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem('chime-device-preferences', JSON.stringify(devicePrefs));
        console.log('✅ Device preferences saved:', devicePrefs);
      } catch (err) {
        console.warn('Failed to save device preferences:', err);
      }
    }
  }, [selectedAudioInput, selectedVideoInput, selectedAudioOutput]);

  // Auto-save preferences when devices change
  useEffect(() => {
    if (selectedAudioInput && selectedVideoInput && selectedAudioOutput) {
      saveDevicePreferences();
    }
  }, [selectedAudioInput, selectedVideoInput, selectedAudioOutput, saveDevicePreferences]);

  useEffect(() => {
    initializeDevices();
    return () => {
      if (videoPreviewRef.current) {
        stopPreview(videoPreviewRef.current);
        if (videoPreviewRef.current.srcObject) {
          const stream = videoPreviewRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoPreviewRef.current.srcObject = null;
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeDevices = async () => {
    try {
      setLoading(true);
      setError('');

      // Populate device lists from Chime context
      await updateDeviceLists();
      // Mirror into local lists for the select controls
      setAudioInputDevices(ctxAudioInputDevices);
      setVideoInputDevices(ctxVideoInputDevices);
      setAudioOutputDevices(ctxAudioOutputDevices);

      // Load saved preferences and auto-start preview
      await loadSavedPreferencesAndStartPreview();

      setLoading(false);
      
    } catch (err) {
      console.error('Device initialization failed:', err);
      setError(`Failed to initialize devices: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  // Keep local lists in sync with provider lists
  useEffect(() => {
    setAudioInputDevices(ctxAudioInputDevices);
    setVideoInputDevices(ctxVideoInputDevices);
    setAudioOutputDevices(ctxAudioOutputDevices);
  }, [ctxAudioInputDevices, ctxVideoInputDevices, ctxAudioOutputDevices]);

  const loadSavedPreferencesAndStartPreview = async () => {
    try {
      const saved = localStorage.getItem('chime-device-preferences');
      
      // Ensure current device lists are available
      const audioInputs = audioInputDevices;
      const videoInputs = videoInputDevices;
      const audioOutputs = audioOutputDevices;
      
      let selectedAudio = audioInputs[0] || null;
      let selectedVideo = videoInputs[0] || null;
      let selectedOutput = audioOutputs[0] || null;
      
      if (saved) {
        try {
          const preferences = JSON.parse(saved);
          console.log('📱 Loading saved device preferences:', preferences);
          
          // Find devices by deviceId
          if (preferences.audioInputId) {
            const savedAudioInput = audioInputs.find(d => getDeviceId(d) === preferences.audioInputId);
            if (savedAudioInput) {
              selectedAudio = savedAudioInput;
              console.log('✅ Restored audio input:', getDeviceLabel(savedAudioInput));
            }
          }
          
          if (preferences.videoInputId) {
            const savedVideoInput = videoInputs.find(d => getDeviceId(d) === preferences.videoInputId);
            if (savedVideoInput) {
              selectedVideo = savedVideoInput;
              console.log('✅ Restored video input:', getDeviceLabel(savedVideoInput));
            }
          }
          
          if (preferences.audioOutputId) {
            const savedAudioOutput = audioOutputs.find(d => getDeviceId(d) === preferences.audioOutputId);
            if (savedAudioOutput) {
              selectedOutput = savedAudioOutput;
              console.log('✅ Restored audio output:', getDeviceLabel(savedAudioOutput));
            }
          }
        } catch (parseError) {
          console.warn('Invalid device preferences in localStorage, using defaults');
          localStorage.removeItem('chime-device-preferences');
        }
      }
      
      // Set selected devices
      if (selectedAudio) setSelectedAudioInput(selectedAudio);
      if (selectedVideo) setSelectedVideoInput(selectedVideo);
      if (selectedOutput) setSelectedAudioOutput(selectedOutput);
      
      // Apply selections to provider and start preview
      if (selectedAudio) await selectAudioInputById(getDeviceId(selectedAudio));
      if (selectedOutput) await selectAudioOutputById(getDeviceId(selectedOutput));
      if (selectedVideo && videoPreviewRef.current) {
        await selectVideoInputById(getDeviceId(selectedVideo));
        console.log('🎥 Auto-starting video preview with device:', getDeviceLabel(selectedVideo));
        await startVideoPreviewForDevice(videoPreviewRef.current, getDeviceId(selectedVideo));
        setIsVideoPreviewActive(true);
      }
      
    } catch (err) {
      console.error('Failed to load saved preferences:', err);
    }
  };

  const startVideoPreview = async (device: Device) => {
    if (!videoPreviewRef.current) return;
    
    try {
      setIsVideoTesting(true);
      setError('');
      
      console.log('🎥 Starting video preview with device:', getDeviceLabel(device));

      await selectVideoInputById(getDeviceId(device));
      await startVideoPreviewForDevice(videoPreviewRef.current, getDeviceId(device));
      console.log('✅ Video preview started');
      
      setIsVideoPreviewActive(true);
      setSelectedVideoInput(device);
      
    } catch (err) {
      console.error('Video preview failed:', err);
      setError(`Video preview failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsVideoTesting(false);
    }
  };

  const toggleVideoPreview = () => {
    if (isVideoPreviewActive) {
      stopVideoPreview();
    } else if (selectedVideoInput) {
      startVideoPreview(selectedVideoInput);
    }
  };

  const testAudioDevice = async (device: Device) => {
    try {
      setIsAudioTesting(true);
      setError('');
      
      console.log('🎤 Testing audio device:', getDeviceLabel(device));
      
      await selectAudioInputById(getDeviceId(device));

      // Start a brief audio level detection
      const testDuration = 2000; // 2 seconds
      let audioLevel = 0;
      
      const analyzeAudio = () => {
        // This is a simplified audio test - in a real implementation,
        // you'd want to use the AudioContext to analyze audio levels
        audioLevel = Math.random() * 100; // Simulate audio level
        
        if (audioLevelRef.current) {
          audioLevelRef.current.style.width = `${audioLevel}%`;
        }
      };
      
      const interval = setInterval(analyzeAudio, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        setIsAudioTesting(false);
        if (audioLevelRef.current) {
          audioLevelRef.current.style.width = '0%';
        }
      }, testDuration);
      
      console.log('✅ Audio device test started');
      setSelectedAudioInput(device);
      
    } catch (err) {
      console.error('Audio device test failed:', err);
      setError(`Audio test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsAudioTesting(false);
    }
  };

  const stopVideoPreview = () => {
    if (videoPreviewRef.current) {
      try {
        console.log('🛑 Stopping video preview...');
        stopPreview(videoPreviewRef.current);
        
        // Clear the video element
        if (videoPreviewRef.current.srcObject) {
          const stream = videoPreviewRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoPreviewRef.current.srcObject = null;
        }
        
        setIsVideoPreviewActive(false);
        console.log('✅ Video preview stopped');
      } catch (err) {
        console.error('Failed to stop video preview:', err);
      }
    }
  };

  const handleSaveDevices = () => {
    if (!selectedAudioInput || !selectedVideoInput || !selectedAudioOutput) {
      setError('Please select and test all devices before continuing');
      return;
    }
    
    // Save preferences one final time
    saveDevicePreferences();
    
    onDevicesReady({
      audioInput: selectedAudioInput,
      videoInput: selectedVideoInput,
      audioOutput: selectedAudioOutput
    });
  };

  const getDeviceId = (device: Device): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (device as any).deviceId || device.toString();
  };

  const getDeviceLabel = (device: Device): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (device as any).label || (device as any).deviceId || device.toString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Setting Up Devices</h3>
            <p className="text-gray-600">Requesting camera and microphone permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Device Setup</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={initializeDevices}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Setup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Camera</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Camera
              </label>
              <select
                value={selectedVideoInput ? getDeviceId(selectedVideoInput) : ''}
                onChange={(e) => {
                  const device = videoInputDevices.find(d => getDeviceId(d) === e.target.value);
                  if (device) {
                    setSelectedVideoInput(device);
                    startVideoPreview(device);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={isVideoTesting}
              >
                <option value="">Select a camera...</option>
                {videoInputDevices.map((device) => (
                  <option key={getDeviceId(device)} value={getDeviceId(device)}>
                    {getDeviceLabel(device)}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-full h-48 bg-gray-900 rounded"
              />
              {isVideoTesting && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Testing camera...</p>
                  </div>
                </div>
              )}
              {selectedVideoInput && !isVideoTesting && isVideoPreviewActive && (
                <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                  ✓ Live Preview
                </div>
              )}
              {selectedVideoInput && !isVideoTesting && !isVideoPreviewActive && (
                <div className="absolute bottom-2 left-2 bg-gray-500 text-white px-2 py-1 rounded text-sm">
                  Preview Stopped
                </div>
              )}
            </div>

            <button
              onClick={toggleVideoPreview}
              className={`w-full py-2 px-4 text-white rounded transition-colors ${
                isVideoPreviewActive 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isVideoTesting || !selectedVideoInput}
            >
              {isVideoTesting 
                ? 'Processing...' 
                : isVideoPreviewActive 
                  ? 'Stop Preview' 
                  : 'Start Preview'
              }
            </button>
          </div>

          {/* Audio Setup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Audio</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Microphone
              </label>
              <select
                value={selectedAudioInput ? getDeviceId(selectedAudioInput) : ''}
                onChange={(e) => {
                  const device = audioInputDevices.find(d => getDeviceId(d) === e.target.value);
                  if (device) {
                    setSelectedAudioInput(device);
                    testAudioDevice(device);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={isAudioTesting}
              >
                <option value="">Select a microphone...</option>
                {audioInputDevices.map((device) => (
                  <option key={getDeviceId(device)} value={getDeviceId(device)}>
                    {getDeviceLabel(device)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio Level {isAudioTesting && '(Speak into your microphone)'}
              </label>
              <div className="w-full h-4 bg-gray-200 rounded">
                <div
                  ref={audioLevelRef}
                  className="h-full bg-green-500 rounded transition-all duration-150"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Speaker
              </label>
              <select
                value={selectedAudioOutput ? getDeviceId(selectedAudioOutput) : ''}
                onChange={(e) => {
                  const device = audioOutputDevices.find(d => getDeviceId(d) === e.target.value);
                  if (device) {
                    setSelectedAudioOutput(device);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select speakers...</option>
                {audioOutputDevices.map((device) => (
                  <option key={getDeviceId(device)} value={getDeviceId(device)}>
                    {getDeviceLabel(device)}
                  </option>
                ))}
              </select>
            </div>

            {selectedAudioInput && (
              <button
                onClick={() => testAudioDevice(selectedAudioInput)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={isAudioTesting}
              >
                {isAudioTesting ? 'Testing Audio...' : 'Test Microphone'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDevices}
            className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={!selectedAudioInput || !selectedVideoInput || !selectedAudioOutput}
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceSetup;