import "../amplifyClient";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";

export const Auth = () => {
  return (
    <Authenticator hideSignUp variation="modal">
      {({ user, signOut }) => (
        <main className="flex flex-col w-screen h-screen items-center justify-center">
          <p className="text-xl font-bold">You have successfully logged in.</p>
          <p className="text-lg font-semibold">Please wait while we redirect</p>
        </main>
      )}
    </Authenticator>
  );
};
