import { useState, useEffect } from "react";
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
    take: 50,
  });
  return { campaigns };
}

export default function Campaigns() {
  const { campaigns } = useLoaderData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <s-page heading="广告活动">
      <Link to="/app/campaigns/new" style={{ display: "inline-block", textDecoration: "none" }}>
        <s-button variant="primary">新建一个广告活动</s-button>
      </Link>

      {campaigns.length === 0 ? (
        <s-section heading="还没有广告活动">
          <s-paragraph>输入商品链接，填写推广诉求，AI 自动生成视频并投放。</s-paragraph>
          <Link to="/app/campaigns/new" style={{ display: "inline-block", textDecoration: "none" }}>
            <s-button>新建第一个活动</s-button>
          </Link>
        </s-section>
      ) : (
        <s-section>
          {campaigns.map((c) => (
            <s-box
              key={c.id}
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="subdued"
              style={{ marginBottom: "8px" }}
            >
              <s-stack direction="inline" align="space-between">
                <s-stack direction="block" gap="tight">
                  <s-text fontWeight="bold">{c.productTitle}</s-text>
                  <s-text>日预算 ${c.dailyBudget} · {c.adStyle}</s-text>
                  <s-text>{mounted ? new Date(c.createdAt).toLocaleString("zh-CN") : "-"}</s-text>
                </s-stack>
                <s-badge>{STATUS_MAP[c.status] || c.status}</s-badge>
              </s-stack>
            </s-box>
          ))}
        </s-section>
      )}
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
