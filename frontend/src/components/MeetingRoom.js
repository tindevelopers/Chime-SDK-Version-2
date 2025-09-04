import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Share, Monitor, MessageSquare, Settings, Users, 
  Copy, Check, ArrowLeft, MoreVertical 
} from 'lucide-react';

const client = generateClient();

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const videoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    joinMeeting();
  }, [meetingId]);

  const joinMeeting = async () => {
    try {
      setLoading(true);
      const response = await client.post('/meetings/join', {
        body: {
          meeting_code: meetingId,
          password: ''
        },
        apiName: 'VideoConferencingAPI'
      });

      setMeeting(response.data.meeting);
      
      // Initialize ChimeSDK meeting
      await initializeChimeMeeting(response.data.attendee, response.data.meeting);
      
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError('Failed to join meeting. Please check your meeting code.');
    } finally {
      setLoading(false);
    }
  };

  const initializeChimeMeeting = async (attendee, meetingData) => {
    try {
      // This would integrate with ChimeSDK for video/audio
      // For now, we'll simulate the meeting interface
      console.log('Initializing ChimeSDK meeting:', { attendee, meetingData });
      
      // In a real implementation, you would:
      // 1. Import ChimeSDK
      // 2. Create meeting session
      // 3. Set up video/audio streams
      // 4. Handle participant events
      
    } catch (err) {
      console.error('Error initializing ChimeSDK:', err);
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    // In real implementation, toggle video stream
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    // In real implementation, toggle audio stream
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    // In real implementation, toggle screen sharing
  };

  const copyMeetingLink = () => {
    const meetingLink = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveMeeting = async () => {
    try {
      // In real implementation, leave ChimeSDK meeting
      await client.post(`/meetings/${meetingId}/end`, {
        apiName: 'VideoConferencingAPI'
      });
      navigate('/');
    } catch (err) {
      console.error('Error leaving meeting:', err);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-white font-semibold">{meeting?.title || 'Meeting'}</h1>
            <p className="text-gray-400 text-sm">Meeting Code: {meeting?.meeting_code}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={copyMeetingLink}
            className="flex items-center space-x-2 text-gray-400 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="text-sm">Copy Link</span>
          </button>
          
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white"
          >
            <Users className="h-4 w-4" />
            <span className="text-sm">Participants</span>
          </button>
          
          <button className="text-gray-400 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Video className="h-16 w-16 mx-auto mb-4" />
              <p>Video stream will appear here</p>
              <p className="text-sm">ChimeSDK integration coming soon</p>
            </div>
          </div>
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              muted
            />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          {showChat ? (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-gray-700">
                <h3 className="text-white font-semibold">Chat</h3>
              </div>
              <div className="flex-1 p-4">
                <div className="text-center text-gray-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                  <p>Chat feature coming soon</p>
                </div>
              </div>
            </div>
          ) : showParticipants ? (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-gray-700">
                <h3 className="text-white font-semibold">Participants</h3>
              </div>
              <div className="flex-1 p-4">
                <div className="text-center text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>Participant list coming soon</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${
              isAudioOn ? 'bg-gray-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoOn ? 'bg-gray-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${
              isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
            }`}
          >
            <Share className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full ${
              showChat ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          
          <button
            onClick={leaveMeeting}
            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
