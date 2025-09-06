"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { Video, Plus, LogIn, Clock, Users } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description: string;
  meeting_code: string;
  max_participants: number;
  created_at: string;
  status: string;
}

const Dashboard = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      // Get current user and session
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Use REST API for fetching meetings
      const response = await fetch('https://xxzrb5vqse.execute-api.us-east-1.amazonaws.com/dev/meetings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMeetings(data || []);
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setError("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to VideoConf
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your modern video conferencing platform powered by AWS ChimeSDK
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/create-meeting"
          className="bg-blue-600 text-white p-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <Plus className="h-8 w-8" />
            <div>
              <h3 className="text-lg font-semibold">Create Meeting</h3>
              <p className="text-blue-100">Start a new video conference</p>
            </div>
          </div>
        </Link>

        <Link
          href="/join-meeting"
          className="bg-green-600 text-white p-6 rounded-lg shadow-md hover:bg-green-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <LogIn className="h-8 w-8" />
            <div>
              <h3 className="text-lg font-semibold">Join Meeting</h3>
              <p className="text-green-100">Enter an existing meeting</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Meetings */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Recent Meetings
          </h2>
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={fetchMeetings}
                className="mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No meetings yet. Create your first meeting to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.slice(0, 5).map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                    <p className="text-sm text-gray-600">{meeting.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(meeting.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {meeting.max_participants} participants
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      meeting.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {meeting.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Code: {meeting.meeting_code}</p>
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
