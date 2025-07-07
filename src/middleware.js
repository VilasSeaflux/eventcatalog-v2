import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(
  async ({ url, locals, redirect, session, cookies }, next) => {
    if (url.pathname.includes("/api/")) {
      return next();
    }

    const user = cookies.get("userEmail");
    const token = cookies.get("idToken");

    if (url.pathname === "/sign-in" && user?.value && token?.value) {
      return redirect("/");
    }
    if (!user?.value && !token?.value && url.pathname !== "/sign-in") {
      return redirect("/sign-in");
    }

    if (user) {
      locals.user = user;
      session.user = user;
    }

    return next();
  }
);
