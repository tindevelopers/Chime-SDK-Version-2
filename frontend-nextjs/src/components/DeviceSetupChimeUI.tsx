'use client'

import React, { useEffect, useState, useRef } from 'react';
import { Device } from 'amazon-chime-sdk-js';
import { useMeetingManager, CameraSelection, MicSelection, PreviewVideo, MeetingProvider, GlobalStyles, DevicesProvider, useAudioInputs, useVideoInputs, useAudioOutputs, lightTheme } from 'amazon-chime-sdk-component-library-react';
import { ThemeProvider } from 'styled-components';

interface Props {
  onDevicesReady: (devices: { audioInput: Device; videoInput: Device; audioOutput: Device }) => void;
  onClose: () => void;
}

function Inner({ onDevicesReady, onClose }: Props) {
  const meetingManager = useMeetingManager();
  const [ready, setReady] = useState(false);
  const { selectedDevice: selectedAudioInput } = useAudioInputs();
  const { selectedDevice: selectedVideoInput } = useVideoInputs();
  const { selectedDevice: selectedAudioOutput } = useAudioOutputs();
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      await meetingManager.updateDeviceLists();
      // Best-effort: rely on library components to render device lists
      setReady(true);
    })();
  }, [meetingManager]);

  const handleChange = async () => {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Device Setup</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <GlobalStyles />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Camera</h3>
            <CameraSelection />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Microphone</h3>
            <MicSelection />
          </div>
        </div>
        <div className="mt-4">
          <PreviewVideo />
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onClose} className="py-2 px-4 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
          <button
            onClick={async () => {
              onDevicesReady({
                // These selectedDevice values match Chime Device types
                audioInput: (selectedAudioInput || '') as unknown as Device,
                videoInput: (selectedVideoInput || '') as unknown as Device,
                audioOutput: (selectedAudioOutput || '') as unknown as Device,
              });
            }}
            disabled={!ready}
            className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeviceSetupChimeUI(props: Props) {
  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalStyles />
      <MeetingProvider>
        <DevicesProvider>
          <Inner {...props} />
        </DevicesProvider>
      </MeetingProvider>
    </ThemeProvider>
  );
}


