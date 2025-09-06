"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinMeetingPage() {
  const [meetingCode, setMeetingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meetingCode.trim()) {
      setError('Please enter a meeting code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For now, we'll navigate directly to the meeting room
      // In a real app, you'd validate the meeting code first
      router.push(`/meeting/${meetingCode}`);
      
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to join meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join a Meeting
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the meeting code to join an existing meeting
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleJoinMeeting}>
          <div>
            <label htmlFor="meeting-code" className="sr-only">
              Meeting Code
            </label>
            <input
              id="meeting-code"
              name="meeting-code"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter meeting code (e.g., MEET-ABC123)"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </div>
              ) : (
                'Join Meeting'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/create-meeting')}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Don&apos;t have a meeting code? Create one instead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
