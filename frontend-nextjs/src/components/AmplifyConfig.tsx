"use client";

import { useEffect } from "react";
import { Amplify } from "aws-amplify";

const AmplifyConfig = () => {
  useEffect(() => {
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
  }, []);

  return null;
};

export default AmplifyConfig;
