import { APIContext } from "astro";

export const prerender = false;
export async function DELETE({ cookies }: APIContext) {
  cookies.delete("userEmail", { path: "/" });
  cookies.delete("idToken", { path: "/" });

  return new Response(
    JSON.stringify({ success: true, message: "user logged out" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
