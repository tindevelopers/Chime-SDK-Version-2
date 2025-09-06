"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Video, Plus, LogIn, LogOut, User } from "lucide-react";

const Navigation = () => {
  const pathname = usePathname();
  
  // Safely use useAuthenticator with error handling
  let user = null;
  let signOut = () => {};
  
  try {
    const auth = useAuthenticator();
    user = auth.user;
    signOut = auth.signOut;
  } catch (error) {
    // If useAuthenticator fails, we're not in an Authenticator context
    // This is fine for pages that don't require authentication
    console.log("Navigation: Not in Authenticator context");
  }

  const handleSignOut = () => {
    if (signOut) {
      signOut();
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">VideoConf</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Video className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/create-meeting"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/create-meeting")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Create Meeting</span>
            </Link>

            <Link
              href="/join-meeting"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/join-meeting")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <LogIn className="h-4 w-4" />
              <span>Join Meeting</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(user as any)?.attributes?.email || (user as any)?.username || 'User'}
                </span>
              </div>
            )}

            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
