import { useState } from "react";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { Button } from "@shopify/polaris";

const STATUS_MAP = {
  pending:    "待处理",
  generating: "生成中",
  ready:      "待投放",
  active:     "投放中",
  paused:     "已暂停",
  killed:     "已熔断",
};

const TABS = [
  { value: "all",        label: "全部" },
  { value: "pending",    label: "待处理" },
  { value: "generating", label: "生成中" },
  { value: "ready",      label: "待投放" },
  { value: "active",     label: "投放中" },
];

export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const campaigns = await db.campaign.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { campaigns };
  } catch (e) {
    return { campaigns: [], authRequired: true };
  }
}

export default function Campaigns() {
  const { campaigns } = useLoaderData();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all"
    ? campaigns
    : campaigns.filter((c) => c.status === activeTab);

  return (
    <div style={{ padding: "24px 0" }}>
      <Button url="/app/campaigns/new" variant="primary">
        新建广告活动
      </Button>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const count = tab.value === "all"
            ? campaigns.length
            : campaigns.filter((c) => c.status === tab.value).length;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: isActive ? "none" : "1px solid #c4cdd5",
                background: isActive ? "#005aff" : "#fff",
                color: isActive ? "#fff" : "#212b36",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {tab.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#212b36" }}>
            {activeTab === "all" ? "还没有广告活动" : `暂无${TABS.find((t) => t.value === activeTab)?.label}的广告活动`}
          </h2>
          <p style={{ color: "#697184", marginBottom: 16 }}>输入商品链接，填写推广诉求，AI 自动生成视频并投放。</p>
          <Button url="/app/campaigns/new" variant="primary">
            新建第一个活动
          </Button>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((c) => (
            <a
              key={c.id}
              href={`/app/campaigns/${c.id}`}
              style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              onClick={(e) => { e.preventDefault(); window.location.href = `/app/campaigns/${c.id}`; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f6f6f7", border: "1px solid #c4cdd5", borderRadius: 8, padding: 12, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {c.videoUrl && c.status === "ready" && c.thumbnailUrl ? (
                    <img src={c.thumbnailUrl} alt="视频封面" style={{ width: 64, height: 36, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 64, height: 36, background: "#d9d9d9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#919eab" }}>
                      无预览
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#212b36" }}>{c.productTitle}</div>
                    <div style={{ fontSize: 12, color: "#697184", marginTop: 2 }}>日预算 ${c.dailyBudget} · {c.adStyle}</div>
                    <div style={{ fontSize: 12, color: "#919eab", marginTop: 2 }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString("zh-CN") : "-"}
                    </div>
                  </div>
                </div>
                <span style={{ background: "#919eab", color: "#fff", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                  {STATUS_MAP[c.status] || c.status}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
