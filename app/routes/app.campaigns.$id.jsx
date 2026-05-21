import { useLoaderData, useNavigate } from "react-router";
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

const AD_STYLE_LABELS = {
  professional: "专业展示",
  viral_funny:  "搞笑病毒",
  emotional:    "情感共鸣",
  comparison:   "对比测评",
  urgency:      "紧迫促销",
};

export const loader = async ({ params, request }) => {
  try {
    await authenticate.admin(request);
  } catch (e) {
    return { authRequired: true };
  }

  const campaign = await db.campaign.findUnique({
    where: { id: params.id },
  });

  if (!campaign) {
    throw new Response("Not Found", { status: 404 });
  }

  return { campaign };
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CampaignDetail() {
  const { campaign } = useLoaderData();
  const navigate = useNavigate();

  return (
    <div style={{ padding: "24px 0", maxWidth: 800 }}>
      <button onClick={() => navigate("/app/campaigns")} style={{ padding: "8px 16px", background: "#f6f6f7", color: "#212b36", border: "1px solid #c4cdd5", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>← 返回列表</button>

      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#212b36" }}>{campaign.productTitle}</h1>
            <p style={{ fontSize: 13, color: "#919eab", marginTop: 4 }}>创建于 {formatDate(campaign.createdAt)}</p>
          </div>
          <span style={{ background: "#008060", color: "#fff", padding: "4px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
            {STATUS_MAP[campaign.status] || campaign.status}
          </span>
        </div>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#212b36" }}>商品信息</h2>
          <div style={{ display: "flex", gap: 16, padding: 16, background: "#f6f6f7", borderRadius: 8 }}>
            {campaign.productImage && (
              <img src={campaign.productImage} alt={campaign.productTitle} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{campaign.productTitle}</div>
              <div style={{ fontSize: 13, color: "#697184", marginTop: 4 }}>商品 ID: {campaign.productId}</div>
              <a href={campaign.productUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#005aff" }}>查看商品 →</a>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#212b36" }}>广告配置</h2>
          <div style={{ padding: 16, background: "#f6f6f7", borderRadius: 8, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontWeight: 600, minWidth: 80, fontSize: 14 }}>日预算</span>
              <span style={{ fontSize: 14 }}>${campaign.dailyBudget} / 天</span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontWeight: 600, minWidth: 80, fontSize: 14 }}>广告风格</span>
              <span style={{ fontSize: 14 }}>{AD_STYLE_LABELS[campaign.adStyle] || campaign.adStyle}</span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontWeight: 600, minWidth: 80, fontSize: 14 }}>目标受众</span>
              <span style={{ fontSize: 14, color: "#697184" }}>{campaign.targetAudience || "-"}</span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontWeight: 600, minWidth: 80, fontSize: 14 }}>核心卖点</span>
              <span style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{campaign.sellingPoints}</span>
            </div>
            {campaign.competitorRef && (
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontWeight: 600, minWidth: 80, fontSize: 14 }}>竞品参考</span>
                <span style={{ fontSize: 14, color: "#697184" }}>{campaign.competitorRef}</span>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#212b36" }}>广告视频</h2>
          {campaign.videoUrl ? (
            <div style={{ padding: 16, background: "#f6f6f7", borderRadius: 8 }}>
              <video
                src={campaign.videoUrl}
                controls
                style={{ width: "100%", maxWidth: 480, borderRadius: 8 }}
              />
              {campaign.thumbnailUrl && (
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>视频封面</span>
                  <img src={campaign.thumbnailUrl} alt="封面" style={{ display: "block", marginTop: 8, width: 160, height: 90, objectFit: "cover", borderRadius: 6 }} />
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 24, background: "#f6f6f7", borderRadius: 8, textAlign: "center", color: "#919eab", fontSize: 14 }}>
              {campaign.status === "generating" ? "🎬 视频生成中，请稍候..." : campaign.status === "pending" ? "⏳ 等待系统处理" : "暂无视频"}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
