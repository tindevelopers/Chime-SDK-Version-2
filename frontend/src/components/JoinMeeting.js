import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { LogIn, ArrowLeft, Copy, Check } from 'lucide-react';

const client = generateClient();

const JoinMeeting = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    meeting_code: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await client.post('/meetings/join', {
        body: formData,
        apiName: 'VideoConferencingAPI'
      });

      // Navigate to the meeting room
      navigate(`/meeting/${response.data.meeting.id}`);
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError('Failed to join meeting. Please check your meeting code and password.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Join Meeting</h1>
        <p className="text-gray-600 mt-2">
          Enter the meeting code to join a video conference
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="meeting_code" className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Code *
            </label>
            <input
              type="text"
              id="meeting_code"
              name="meeting_code"
              value={formData.meeting_code}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter meeting code"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Password (if required)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter meeting password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Joining Meeting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <LogIn className="h-5 w-5 mr-2" />
                Join Meeting
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Ask the meeting host for the meeting code</p>
          <p>• Meeting codes are usually 6-8 characters long</p>
          <p>• If the meeting is password protected, you'll need the password too</p>
        </div>
      </div>
    </div>
  );
};

export default JoinMeeting;
