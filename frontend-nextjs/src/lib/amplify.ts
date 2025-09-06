import { Amplify } from "aws-amplify";

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_2lpfwBcaO",
      userPoolClientId: "uus0oqfhqto7lo0rud3nco8a0",
      signUpVerificationMethod: "code" as const,
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
};

// Only configure once
if (!Amplify.getConfig().Auth) {
  Amplify.configure(amplifyConfig);
}

export default amplifyConfig;
