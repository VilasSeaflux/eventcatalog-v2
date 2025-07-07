import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      userPoolId: import.meta.env.VITE_COGNITO_POOL,
      loginWith: {
        email: true,
      },
    },
  },
});
