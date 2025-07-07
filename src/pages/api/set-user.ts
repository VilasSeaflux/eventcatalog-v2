import { APIContext, APIRoute, AstroCookies, RouteData } from "astro";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export const prerender = false;

const domain = import.meta.env.VITE_COGNITO_SIGN_IN_URL;

const client = jwksClient({
  jwksUri: domain,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

function verifyCognitoToken(
  token: string,
  expectedEmail: string
): Promise<{ email: string; idToken: string }> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {}, (err, decoded) => {
      if (err) {
        console.error("JWT verification failed:", err);
        return reject(new Error("Invalid token"));
      }

      if (decoded?.email !== expectedEmail) {
        console.error("Email mismatch:", decoded?.email, expectedEmail);
        return reject(new Error("Email does not match token"));
      }

      resolve({ email: decoded.email, idToken: token });
    });
  });
}

export async function POST({ request, cookies }: APIContext) {
  let email;
  let token;
  try {
    const body = await request.json();
    email = body.email;
    token = body.idToken;

    if (!token || !email) {
      return new Response(
        JSON.stringify({ message: "Missing token or email" }),
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("API /set-user: Error parsing JSON body", error);
  }

  try {
    const { email: verifiedEmail, idToken: verifiedToken } =
      await verifyCognitoToken(token, email);

    cookies.set("userEmail", verifiedEmail, {
      path: "/",
      httpOnly: true,
    });
    cookies.set("idToken", verifiedToken, {
      path: "/",
      httpOnly: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: { email: verifiedEmail, idToken: verifiedToken },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
