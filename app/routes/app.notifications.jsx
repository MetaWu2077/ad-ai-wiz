import { useLoaderData, useNavigate } from "react-router";
import { Button } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useRouteError } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const notifications = await db.notification.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { notifications };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "mark_read") {
    const id = formData.get("id");
    if (id) {
      await db.notification.update({
        where: { id },
        data: { read: true },
      });
    }
  } else if (intent === "mark_all_read") {
    await db.notification.updateMany({
      where: { shop: session.shop, read: false },
      data: { read: true },
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: "/app/notifications" },
  });
}

export default function Notifications() {
  const { notifications } = useLoaderData();
  const navigate = useNavigate();

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const typeLabels = {
    video_ready: "视频生成",
  };

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>通知中心</h1>
        {notifications.some((n) => !n.read) && (
          <form method="post">
            <input type="hidden" name="intent" value="mark_all_read" />
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                background: "#0066ff",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              标记全部已读
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔔</div>
          <p style={{ fontSize: "16px" }}>暂无通知</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                background: notification.read ? "#f9f9f9" : "#fff",
                border: "1px solid #e5e5e5",
                borderLeft: notification.read ? "4px solid #e5e5e5" : "4px solid #0066ff",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                boxShadow: notification.read ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "2px 8px",
                      background: "#e8f0fe",
                      color: "#1a73e8",
                      borderRadius: "4px",
                    }}
                  >
                    {typeLabels[notification.type] || notification.type}
                  </span>
                  {!notification.read && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        background: "#0066ff",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: notification.read ? "400" : "600",
                    margin: "0 0 4px 0",
                    color: "#1a1a1a",
                  }}
                >
                  {notification.title}
                </h3>
                {notification.body && (
                  <p style={{ fontSize: "14px", color: "#666", margin: "0 0 8px 0", lineHeight: "1.5" }}>
                    {notification.body}
                  </p>
                )}
                <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>{formatTime(notification.createdAt)}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {notification.campaignId && (
                  <Button onClick={() => navigate(`/app/campaigns/${notification.campaignId}`)}>
                    查看
                  </Button>
                )}
                {!notification.read && (
                  <form method="post">
                    <input type="hidden" name="intent" value="mark_read" />
                    <input type="hidden" name="id" value={notification.id} />
                    <button
                      type="submit"
                      style={{
                        padding: "6px 12px",
                        background: "transparent",
                        color: "#666",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      标为已读
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};