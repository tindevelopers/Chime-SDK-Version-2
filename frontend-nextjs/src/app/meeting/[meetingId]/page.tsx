'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Device } from 'amazon-chime-sdk-js';
import { ChimeProvider, useChime } from '@/components/ChimeProvider';
import { VideoGrid } from '@/components/VideoGrid';
import { MeetingControls } from '@/components/MeetingControls';
// Using Chime React Component Library-based setup
import DeviceSetupChimeUI from '@/components/DeviceSetupChimeUI';

interface Meeting {
  id: string;
  title: string;
  description: string;
  meeting_code: string;
  max_participants: number;
  created_at: string;
  status: string;
  chime_meeting_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chime_meeting: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chime_attendee: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media_placement: any;
  meeting_region: string;
}

// Inner component that uses ChimeSDK
function MeetingRoomContent({ 
  meeting, 
  user, 
  signOut 
}: { 
  meeting: Meeting; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signOut: any; 
}) {
  const { joinMeeting, meetingSession, isLoading, error } = useChime();
  const [showDeviceSetup, setShowDeviceSetup] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<{
    audioInput: Device;
    videoInput: Device;
    audioOutput: Device;
  } | null>(null);

  const handleJoinMeeting = useCallback(async () => {
    try {
      console.log('🚀 Joining ChimeSDK meeting...', {
        meetingData: meeting.chime_meeting,
        attendeeData: meeting.chime_attendee,
        hasSelectedDevices: !!selectedDevices
      });

      await joinMeeting(meeting.chime_meeting, meeting.chime_attendee, selectedDevices || undefined);
      console.log('✅ Successfully joined ChimeSDK meeting');
    } catch (err) {
      console.error('❌ Failed to join meeting:', err);
    }
  }, [meeting.chime_meeting, meeting.chime_attendee, joinMeeting, selectedDevices]);

  const handleDevicesReady = useCallback(async (devices: {
    audioInput: Device;
    videoInput: Device;
    audioOutput: Device;
  }) => {
    console.log('✅ Devices selected and tested:', devices);
    setSelectedDevices(devices);
    setShowDeviceSetup(false);
    
    // Join with the newly selected devices
    try {
      console.log('🚀 Joining ChimeSDK meeting with selected devices...', {
        meetingData: meeting.chime_meeting,
        attendeeData: meeting.chime_attendee,
        devices
      });

      await joinMeeting(meeting.chime_meeting, meeting.chime_attendee, devices);
      console.log('✅ Successfully joined ChimeSDK meeting');
    } catch (err) {
      console.error('❌ Failed to join meeting:', err);
    }
  }, [meeting.chime_meeting, meeting.chime_attendee, joinMeeting]);

  const handleShowDeviceSetup = useCallback(() => {
    setShowDeviceSetup(true);
  }, []);

  const handleCloseDeviceSetup = useCallback(() => {
    setShowDeviceSetup(false);
  }, []);

  // Load saved device preferences
  useEffect(() => {
    const savedDevices = localStorage.getItem('chime-device-preferences');
    if (savedDevices) {
      try {
        const devicePrefs = JSON.parse(savedDevices);
        // Check if saved devices are less than 1 hour old
        if (Date.now() - devicePrefs.timestamp < 60 * 60 * 1000) {
          setSelectedDevices({
            audioInput: devicePrefs.audioInput,
            videoInput: devicePrefs.videoInput,
            audioOutput: devicePrefs.audioOutput
          });
          console.log('✅ Loaded saved device preferences');
        }
      } catch (err) {
        console.warn('Failed to load saved device preferences:', err);
      }
    }
  }, []);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold">{meeting.title}</h1>
              <p className="text-gray-300 text-sm">Meeting Code: {meeting.meeting_code}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                {user?.username || 'User'}
              </span>
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Meeting Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Area */}
        <div className="flex-1 bg-gray-900">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-lg">Connecting to meeting...</p>
                <p className="text-gray-400 text-sm mt-2">Setting up audio and video</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-lg mb-2">Failed to connect</p>
                <p className="text-gray-400 text-sm mb-4">{error}</p>
                <button
                  onClick={handleJoinMeeting}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : meetingSession ? (
            <VideoGrid />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🎥</div>
                <p className="text-xl mb-6">Ready to join meeting</p>
                
                {selectedDevices ? (
                  <div className="space-y-4">
                    <div className="bg-green-800 bg-opacity-50 rounded-lg p-4 mb-4">
                      <div className="text-green-400 text-sm mb-2">✅ Devices Ready</div>
                      <div className="text-xs text-gray-300">
                        Camera and microphone have been tested and configured
                      </div>
                    </div>
                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={handleJoinMeeting}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Join Video Call
                      </button>
                      <button
                        onClick={handleShowDeviceSetup}
                        className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Test Devices Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-yellow-800 bg-opacity-50 rounded-lg p-4 mb-4">
                      <div className="text-yellow-400 text-sm mb-2">⚠️ Setup Required</div>
                      <div className="text-xs text-gray-300">
                        Test your camera and microphone before joining
                      </div>
                    </div>
                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={handleShowDeviceSetup}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Setup Devices First
                      </button>
                      <button
                        onClick={handleJoinMeeting}
                        className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Join Without Setup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Meeting Controls */}
        {meetingSession && <MeetingControls />}
      </div>

      {/* Device Setup Modal */}
      {showDeviceSetup && (
        <DeviceSetupChimeUI
          onDevicesReady={handleDevicesReady}
          onClose={handleCloseDeviceSetup}
        />
      )}
    </div>
  );
}

export default function MeetingRoomPage() {
  const params = useParams();
  const { user, signOut } = useAuthenticator();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const meetingId = params.meetingId as string;

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user and session
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        
        if (!token) {
          throw new Error('No authentication token available');
        }
        
        // Fetch meeting details from API
        const response = await fetch(`https://xxzrb5vqse.execute-api.us-east-1.amazonaws.com/dev/meetings/${meetingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Meeting not found');
          }
          throw new Error(`Failed to fetch meeting: ${response.statusText}`);
        }
        
        const meetingData = await response.json();
        console.log('Meeting details fetched:', meetingData);
        
        setMeeting(meetingData);
      } catch (err) {
        console.error('Error fetching meeting details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load meeting');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeetingDetails();
  }, [meetingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meeting room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Not Found</h1>
          <p className="text-gray-600 mb-4">The meeting you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChimeProvider>
      <MeetingRoomContent meeting={meeting} user={user} signOut={signOut} />
    </ChimeProvider>
  );
}
