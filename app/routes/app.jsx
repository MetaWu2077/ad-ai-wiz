import { Outlet, useLoaderData, useRouteError, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  let session = null;
  let authError = null;
  try {
    session = await authenticate.admin(request);
  } catch (e) {
    authError = e;
  }

  let unreadCount = 0;
  if (session?.shop) {
    unreadCount = await db.notification.count({
      where: { shop: session.shop, read: false },
    });
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    appUrl: process.env.SHOPIFY_APP_URL || "NOT_SET",
    authError: authError?.message || null,
    sessionId: session?.id || null,
    unreadCount,
  };
};

export default function App() {
  const { apiKey, unreadCount } = useLoaderData();
  const shopify = useAppBridge();
  const navigate = useNavigate();


  const navTo = (path) => {
    navigate(path);
  };

  return (
    <AppProvider embedded apiKey={apiKey}>
      {/* Simple top navigation */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "0 16px", marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0, height: 48 }}>
          <button onClick={() => navTo("/app")} style={{ padding: "0 16px", height: "100%", display: "flex", alignItems: "center", color: "#212b36", textDecoration: "none", fontSize: 14, fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>首页</button>
          <button onClick={() => navTo("/app/campaigns")} style={{ padding: "0 16px", height: "100%", display: "flex", alignItems: "center", color: "#212b36", textDecoration: "none", fontSize: 14, fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>广告活动</button>
          <button onClick={() => navTo("/app/notifications")} style={{ padding: "0 16px", height: "100%", display: "flex", alignItems: "center", color: "#212b36", textDecoration: "none", fontSize: 14, fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
            通知{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        </div>
      </nav>
      {/* Page content */}
      <div style={{ padding: "24px" }}>
        <Outlet />
      </div>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <AppProvider embedded>
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>加载出错</h1>
        <p style={{ color: "#697184", marginTop: 8 }}>{error?.message || "发生了未知错误"}</p>
        <a href="/app" style={{ display: "inline-block", marginTop: 16, padding: "8px 16px", background: "#005aff", color: "#fff", borderRadius: 4, textDecoration: "none", fontSize: 14 }}>返回首页</a>
      </div>
    </AppProvider>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};