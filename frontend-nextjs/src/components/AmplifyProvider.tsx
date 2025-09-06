"use client";

import { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";

interface AmplifyProviderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: (props: { signOut?: (data?: any) => void; user?: any }) => React.ReactElement;
}

const AmplifyProvider = ({ children }: AmplifyProviderProps) => {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Only configure on the client side
    if (typeof window !== "undefined") {
      const configureAmplify = () => {
        try {
          // Always configure Amplify to ensure it's set up properly
          Amplify.configure({
            Auth: {
              Cognito: {
                userPoolId: "us-east-1_2lpfwBcaO",
                userPoolClientId: "uus0oqfhqto7lo0rud3nco8a0",
                signUpVerificationMethod: "code",
              },
            },
            API: {
              REST: {
                VideoConferencingAPI: {
                  endpoint: "https://xxzrb5vqse.execute-api.us-east-1.amazonaws.com/dev",
                  region: "us-east-1",
                },
              },
            },
          });
          
          console.log("Amplify configured successfully");
          
          // Set configured immediately after configuration
          setIsConfigured(true);
        } catch (error) {
          console.error("Error configuring Amplify:", error);
          // Still set as configured to prevent infinite loading
          setIsConfigured(true);
        }
      };

      // Configure immediately
      configureAmplify();
    }
  }, []);

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Authenticator
      signUpAttributes={["email"]}
      socialProviders={[]}
      variation="modal"
    >
      {children}
    </Authenticator>
  );
};

export default AmplifyProvider;
