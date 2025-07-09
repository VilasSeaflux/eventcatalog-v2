import "../amplifyClient";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "@aws-amplify/auth";
import { useEffect, useState } from "react";
import parseJwt from "../utils/verifyToken";
import {isBelongsTo} from "../utils/permissions";

export const Auth = () => {
    const [hasPermission, setHasPermission] = useState(true);
  const [checked, setChecked] = useState(false);
  
  useEffect(() => {
    async function checkPermission(){
      try{
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken.toString() || "";
        const decoded = await parseJwt(token);
        const groups = await decoded?.['cognito:groups'] || [];
        const hasPermission = isBelongsTo(groups);
        setHasPermission(hasPermission);
      }catch(err){
        console.log("error", err);
      }
    }
    setChecked(true);

    checkPermission();
  }, []);


  
  return (
    <Authenticator hideSignUp variation="modal">
      {({ user, signOut }) => {
      if(!checked){
        return <p>Checking Permission....</p>;
      }

      if(!hasPermission){
        return (
       <main className="flex flex-col w-screen h-screen items-center justify-center">
          <p className="text-xl font-bold">You don't have the required permission</p>
          <p className="text-lg font-semibold">Please logout and sign-in again</p>
          <button onClick={signOut} className="bg-slate-900 px-8 py-2 rounded-md mt-2 text-slate-100">Sign out</button>
        </main>
        )
      }
        
     return  (  
       <main className="flex flex-col w-screen h-screen items-center justify-center">
          <p className="text-xl font-bold">You have successfully logged in.</p>
          <p className="text-lg font-semibold">Please wait while we redirect</p>
        </main>)
      }}
    </Authenticator>
  );
};
