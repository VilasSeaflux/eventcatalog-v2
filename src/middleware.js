import { signOut } from "@aws-amplify/auth";
import { defineMiddleware } from "astro:middleware";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: import.meta.env.VITE_COGNITO_SIGN_IN_URL,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    callback(null, key?.getPublicKey());
  });
}

function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {}, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

export const onRequest = defineMiddleware(
  async ({ url, locals, redirect, cookies }, next) => {
    if (url.pathname.includes("/api/") || url.pathname.includes("/sign-out")) {
      return next();
    }

    const token = cookies.get("idToken")?.value;

    // If no token, block access except sign-in page
    if (!token && url.pathname !== "/sign-in") {
      return redirect("/sign-in");
    }

    try {
      if (token) {
        // If token exists, verify it
        const decoded = await verifyAccessToken(token);
        locals.user = decoded;
      }
      if (url.pathname === "/sign-in" && token) {
        return redirect("/");
      }
    } catch (err) {
      console.error("Invalid JWT token:", err);
      cookies.delete("idToken");
      cookies.delete("userEmail");
      return redirect("/sign-out");
    }

    return next();
  }
);
