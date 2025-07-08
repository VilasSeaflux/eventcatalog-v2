import { APIContext } from "astro";
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

function verifyCognitoAccessToken(
  token: string,
  expectedSub: string
): Promise<{ sub: string; accessToken: string }> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {}, (err, decoded) => {
      if (err) {
        console.error("JWT verification failed:", err);

        return reject(new Error("Invalid token"));
      }

      if (!decoded?.sub) {
        console.error("Decoded token missing sub:", decoded);
        return reject(new Error("Token missing subject"));
      }

      if (decoded.sub !== expectedSub) {
        console.error("Sub mismatch:", decoded.sub, expectedSub);
        return reject(new Error("Sub does not match token"));
      }

      resolve({ sub: decoded.sub, accessToken: token });
    });
  });
}

export async function POST({ request, cookies }: APIContext) {
  let email;
  let token;
  let sub;
  try {
    const body = await request.json();
    email = body.email;
    token = body.idToken;
    sub = body.sub;

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
    const { sub: verifiedEmail, accessToken: verifiedToken } =
      await verifyCognitoAccessToken(token, sub);

    cookies.set("userEmail", email, {
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
