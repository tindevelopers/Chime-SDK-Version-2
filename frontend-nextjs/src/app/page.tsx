"use client";

import Link from "next/link";
import { Video, Plus, LogIn, ArrowRight, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">VideoConf</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/create-meeting"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create Meeting
              </Link>
              <Link
                href="/join-meeting"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Join Meeting
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Modern Video Conferencing
            <span className="text-blue-600"> Powered by AWS</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Experience crystal-clear video calls, seamless screen sharing, and enterprise-grade security 
            with our ChimeSDK-powered platform. Built for teams that demand quality and reliability.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/create-meeting"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Start a Meeting
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link
              href="/join-meeting"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Join Meeting
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">HD Video Quality</h3>
              <p className="text-gray-600">Crystal-clear video calls with adaptive bitrate for optimal performance</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Scalable Meetings</h3>
              <p className="text-gray-600">Host meetings with up to 100 participants with enterprise-grade infrastructure</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Access</h3>
              <p className="text-gray-600">Simple meeting codes and one-click joining for seamless collaboration</p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-16 p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Built with Modern Technology</h2>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">Next.js 15</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">AWS ChimeSDK</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">Lambda Functions</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">PostgreSQL</span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">AWS Cognito</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
