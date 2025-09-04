import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { Video, Plus, LogIn, Clock, Users, Calendar } from 'lucide-react';

const client = generateClient();

const Dashboard = () => {
  const { user } = useAuthenticator();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await client.get('/meetings', {
        apiName: 'VideoConferencingAPI'
      });
      setMeetings(response.data || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600 mt-2">
          Manage your video meetings and join new ones
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/create-meeting"
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create Meeting</h3>
              <p className="text-gray-600">Start a new video conference</p>
            </div>
          </div>
        </Link>

        <Link
          to="/join-meeting"
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <LogIn className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Join Meeting</h3>
              <p className="text-gray-600">Enter with a meeting code</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Meetings */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Meetings</h2>
        </div>
        
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchMeetings}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No meetings yet</p>
              <Link
                to="/create-meeting"
                className="mt-2 inline-block text-blue-600 hover:text-blue-800"
              >
                Create your first meeting
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.slice(0, 5).map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Video className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                      <p className="text-sm text-gray-600">{meeting.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(meeting.created_at)}
                        </span>
                        <span className="flex items-center text-xs text-gray-500">
                          <Users className="h-3 w-3 mr-1" />
                          {meeting.active_participants || 0} participants
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      meeting.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {meeting.status}
                    </span>
                    <Link
                      to={`/meeting/${meeting.id}`}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Join
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
