import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import Dashboard from './components/Dashboard';
import MeetingRoom from './components/MeetingRoom';
import CreateMeeting from './components/CreateMeeting';
import JoinMeeting from './components/JoinMeeting';
import Navigation from './components/Navigation';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_2lpfwBcaO',
    userPoolWebClientId: 'uus0oqfhqto7lo0rud3nco8a0',
  },
  API: {
    REST: {
      VideoConferencingAPI: {
        endpoint: 'https://xxzrb5vqse.execute-api.us-east-1.amazonaws.com/dev',
        region: 'us-east-1'
      }
    }
  }
});

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-meeting" element={<CreateMeeting />} />
            <Route path="/join-meeting" element={<JoinMeeting />} />
            <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default withAuthenticator(App, {
  signUpAttributes: ['email'],
  socialProviders: [],
  variation: 'modal'
});
