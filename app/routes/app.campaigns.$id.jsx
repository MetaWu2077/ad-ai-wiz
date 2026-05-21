import { useState, useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { Button } from "@shopify/polaris";
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

export async function loader({ request, params }) {
  const { session } = await authenticate.admin(request);

  const campaign = await db.campaign.findUnique({
    where: { id: params.id },
  });

  if (!campaign || campaign.shop !== session.shop) {
    throw new Response("Not Found", { status: 404 });
  }

  return { campaign };
}

export default function CampaignDetail() {
  const { campaign } = useLoaderData();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (date) =>
    mounted ? new Date(date).toLocaleString("zh-CN") : "-";

  return (
    <s-page heading="广告活动详情">
      <Button onClick={() => navigate("/app/campaigns")}>← 返回列表</Button>

      {/* Header */}
      <s-section heading="活动概览">
        <s-stack direction="inline" align="space-between" blockAlign="center">
          <s-stack direction="block" gap="tight">
            <s-text fontWeight="bold" fontSize="lg">{campaign.productTitle}</s-text>
            <s-text>创建于 {formatDate(campaign.createdAt)}</s-text>
          </s-stack>
          <s-badge>{STATUS_MAP[campaign.status] || campaign.status}</s-badge>
        </s-stack>
      </s-section>

      {/* Product info */}
      <s-section heading="商品信息">
        <s-stack direction="inline" gap="base">
          {campaign.productImage && (
            <img
              src={campaign.productImage}
              alt={campaign.productTitle}
              style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 10 }}
            />
          )}
          <s-stack direction="block" gap="tight">
            <s-text fontWeight="bold">{campaign.productTitle}</s-text>
            {campaign.productUrl && (
              <s-link href={campaign.productUrl} target="_blank">
                查看商品链接 →
              </s-link>
            )}
            {campaign.productId && (
              <s-text>商品 ID: {campaign.productId}</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>

      {/* Campaign config */}
      <s-section heading="广告配置">
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base">
              <s-text fontWeight="bold" style={{ minWidth: 80 }}>日预算</s-text>
              <s-text>${campaign.dailyBudget} / 天</s-text>
            </s-stack>
            <s-stack direction="inline" gap="base">
              <s-text fontWeight="bold" style={{ minWidth: 80 }}>广告风格</s-text>
              <s-text>{campaign.adStyle}</s-text>
            </s-stack>
            {campaign.targetAudience && (
              <s-stack direction="inline" gap="base">
                <s-text fontWeight="bold" style={{ minWidth: 80 }}>目标受众</s-text>
                <s-text>{campaign.targetAudience}</s-text>
              </s-stack>
            )}
            <s-stack direction="inline" gap="base">
              <s-text fontWeight="bold" style={{ minWidth: 80 }}>核心卖点</s-text>
              <s-text style={{ whiteSpace: "pre-wrap" }}>{campaign.sellingPoints}</s-text>
            </s-stack>
            {campaign.competitorRef && (
              <s-stack direction="inline" gap="base">
                <s-text fontWeight="bold" style={{ minWidth: 80 }}>竞品参考</s-text>
                <s-text>{campaign.competitorRef}</s-text>
              </s-stack>
            )}
          </s-stack>
        </s-box>
      </s-section>

      {/* Video section */}
      <s-section heading="广告视频">
        {campaign.videoUrl ? (
          <s-stack direction="block" gap="base">
            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="subdued"
            >
              <video
                controls
                src={campaign.videoUrl}
                poster={campaign.thumbnailUrl || undefined}
                style={{ width: "100%", maxWidth: 640, borderRadius: 8 }}
              />
            </s-box>
            {campaign.thumbnailUrl && (
              <s-stack direction="inline" gap="base">
                <s-text fontWeight="bold">视频封面</s-text>
                <img
                  src={campaign.thumbnailUrl}
                  alt="封面"
                  style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 6 }}
                />
              </s-stack>
            )}
          </s-stack>
        ) : campaign.status === "generating" ? (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-paragraph>🎬 视频生成中，请稍候...</s-paragraph>
          </s-box>
        ) : campaign.status === "pending" ? (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-paragraph>⏳ 等待系统处理</s-paragraph>
          </s-box>
        ) : (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-paragraph>暂无视频</s-paragraph>
          </s-box>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};