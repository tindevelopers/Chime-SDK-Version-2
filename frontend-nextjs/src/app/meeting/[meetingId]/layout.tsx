"use client";

import AmplifyProvider from "@/components/AmplifyProvider";

export default function MeetingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AmplifyProvider>
      {({ signOut, user }) => (
        <>
          {children}
        </>
      )}
    </AmplifyProvider>
  );
}
