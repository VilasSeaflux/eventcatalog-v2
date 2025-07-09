import "../amplifyClient";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { getCurrentUser, signOut } from "@aws-amplify/auth";
import { useEffect, useState } from "react";
import parseJwt, { isTokenExpired } from "../utils/verifyToken";
import { isBelongsTo } from "../utils/permissions";

export const Auth = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [checked, setChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  async function handleFullSignOut() {
    await signOut();
    localStorage.clear();
    window.location.replace("/sign-in");
  }

  useEffect(() => {
    async function checkPermission() {
      try {
        const keys = Object.keys(localStorage);
        const accessTokenKey = keys.find(
          (k) =>
            k.startsWith(
              `CognitoIdentityServiceProvider.${
                import.meta.env.VITE_COGNITO_CLIENT_ID
              }`
            ) && k.endsWith(".accessToken")
        );

        const token = accessTokenKey
          ? localStorage.getItem(accessTokenKey)
          : null;
        setToken(token);

        if (!token) {
          setChecked(true);
          return;
        }

        const decoded = await parseJwt(token);

        if (await isTokenExpired(decoded)) {
          await handleFullSignOut();
          return;
        }

        const groups = decoded?.["cognito:groups"] || [];
        setHasPermission(isBelongsTo(groups));
      } catch (err) {
        console.log("Auth check error:", err);
      } finally {
        setChecked(true);
      }
    }

    checkPermission();
  }, []);

  if (!checked) {
    return (
      <main className="flex flex-col w-screen h-screen items-center justify-center">
        <p className="text-xl font-bold">Checking Permission...</p>
      </main>
    );
  }

  if (!token) {
    return (
      <Authenticator hideSignUp variation="modal">
        {({ user }) => (
          <main className="flex flex-col w-screen h-screen items-center justify-center">
            <p className="text-xl font-bold">
              You have successfully logged in.
            </p>
            <p className="text-lg font-semibold">
              Please wait while we redirect
            </p>
          </main>
        )}
      </Authenticator>
    );
  }

  if (!hasPermission && token && !checked) {
    return (
      <main className="flex flex-col w-screen h-screen items-center justify-center">
        <p className="text-xl font-bold">
          You don't have the required permission
        </p>
        <p className="text-lg font-semibold">Please logout and sign-in again</p>
        <button
          onClick={handleFullSignOut}
          className="bg-slate-900 px-8 py-2 rounded-md mt-2 text-slate-100"
        >
          Sign out
        </button>
      </main>
    );
  }
};
