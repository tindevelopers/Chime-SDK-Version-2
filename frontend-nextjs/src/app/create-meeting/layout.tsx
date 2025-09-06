"use client";

import Navigation from "@/components/Navigation";
import AmplifyProvider from "@/components/AmplifyProvider";

export default function CreateMeetingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AmplifyProvider>
      {({ signOut, user }) => (
        <>
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </>
      )}
    </AmplifyProvider>
  );
}
