import { useLoaderData, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const STATUS_MAP = {
  pending:    "待处理",
  generating: "生成中",
  ready:      "待投放",
  active:     "投放中",
  paused:     "已暂停",
  killed:     "已熔断",
};

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const campaigns = await db.campaign.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const all = await db.campaign.findMany({
    where: { shop: session.shop },
    select: { status: true },
  });

  const stats = {
    total:       all.length,
    pending:     all.filter((c) => c.status === "pending").length,
    generating:  all.filter((c) => c.status === "generating").length,
    ready:       all.filter((c) => c.status === "ready").length,
    active:      all.filter((c) => c.status === "active").length,
    paused:      all.filter((c) => c.status === "paused").length,
  };

  return { campaigns, stats };
}

export default function Index() {
  const { campaigns, stats } = useLoaderData();

  return (
    <div style={{ padding: "24px 0" }}>
      {/* CTA */}
      <div style={{ background: "#f6f6f7", border: "1px solid #c4cdd5", borderRadius: 8, padding: "32px 24px", textAlign: "center", marginBottom: 24 }}>
        <p style={{ fontSize: 18, marginBottom: 16, fontFamily: "system-ui", color: "#212b36" }}>
          🎬 输入商品链接，AI 自动生成广告视频并投放到 Facebook、Instagram、TikTok
        </p>
        <Link to="/app/campaigns/new" style={{ display: "inline-block", textDecoration: "none" }}>
          <button style={{ background: "#005aff", color: "#fff", border: "none", borderRadius: 4, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            新建广告活动 →
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#212b36" }}>数据概览</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "全部活动", value: stats.total, color: "#212b36" },
            { label: "处理中", value: stats.pending + stats.generating, color: "#bf5700" },
            { label: "待投放", value: stats.ready, color: "#008060" },
            { label: "投放中", value: stats.active, color: "#005aff" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#f6f6f7", border: "1px solid #c4cdd5", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: "#697184", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent campaigns */}
      {campaigns.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#212b36" }}>最近活动</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {campaigns.map((c) => (
              <Link
                key={c.id}
                to={`/app/campaigns/${c.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f6f6f7", border: "1px solid #c4cdd5", borderRadius: 8, padding: 12, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {c.videoUrl && c.thumbnailUrl && c.status === "ready" ? (
                      <img src={c.thumbnailUrl} alt="封面" style={{ width: 56, height: 32, objectFit: "cover", borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 56, height: 32, background: "#d9d9d9", borderRadius: 4 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#212b36" }}>{c.productTitle}</div>
                      <div style={{ fontSize: 12, color: "#697184", marginTop: 2 }}>日预算 ${c.dailyBudget}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: c.status === "active" ? "#008060" : "#919eab", color: "#fff", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                      {STATUS_MAP[c.status] || c.status}
                    </span>
                    <span style={{ color: "#919eab" }}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {stats.total > 3 && (
            <Link to="/app/campaigns" style={{ display: "inline-block", textDecoration: "none", marginTop: 12 }}>
              <button style={{ background: "none", border: "1px solid #c4cdd5", borderRadius: 4, padding: "6px 12px", fontSize: 13, cursor: "pointer", color: "#212b36" }}>
                查看全部 {stats.total} 个活动 →
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};