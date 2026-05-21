import { redirect } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  console.log("[auth.callback] loader called, URL:", url.pathname);
  
  try {
    const session = await authenticate.admin(request);
    console.log("[auth.callback] OAuth callback succeeded, session:", session?.id);
    return redirect("/app");
  } catch (error) {
    console.error("[auth.callback] OAuth callback failed:", error?.message || error);
    return redirect("/app");
  }
};

export const action = async ({ request }) => {
  const url = new URL(request.url);
  console.log("[auth.callback] action called, URL:", url.pathname);
  
  try {
    const session = await authenticate.admin(request);
    console.log("[auth.callback] OAuth POST callback succeeded, session:", session?.id);
    return redirect("/app");
  } catch (error) {
    console.error("[auth.callback] OAuth POST callback failed:", error?.message || error);
    return redirect("/app");
  }
};