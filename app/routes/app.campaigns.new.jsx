import { useState, useCallback } from "react";
import { Link, redirect, useActionData, useNavigation, useSubmit } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }) {
  await authenticate.admin(request);
  return {};
}

export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "fetch_product") {
    const productUrl = formData.get("productUrl");
    let handle = productUrl.trim();
    const match = handle.match(/\/products\/([^/?#]+)/);
    if (match) handle = match[1];

    const response = await admin.graphql(`
      query GetProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          title
          tags
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
          }
          compareAtPriceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 1) {
            edges { node { url altText } }
          }
        }
      }
    `, { variables: { handle } });

    const data = await response.json();
    const product = data?.data?.productByHandle;

    if (!product) {
      return { error: "找不到该商品，请检查链接或 Handle 是否正确", intent: "fetch_product" };
    }
    return { product, intent: "fetch_product" };
  }

  if (intent === "create_campaign") {
    await db.campaign.create({
      data: {
        shop:          session.shop,
        productId:     formData.get("productId"),
        productTitle:  formData.get("productTitle"),
        productImage:  formData.get("productImage"),
        targetAudience: formData.get("targetAudience"),
        sellingPoints:  formData.get("sellingPoints"),
        dailyBudget:    parseFloat(formData.get("dailyBudget")) || 20,
        adStyle:        formData.get("adStyle"),
        competitorRef:  formData.get("competitorRef"),
        status:         "pending",
      },
    });
    return redirect("/app/campaigns");
  }

  return { error: "未知操作" };
}

const AD_STYLES = [
  { value: "professional", label: "专业展示 - 干净背景，突出产品细节" },
  { value: "viral_funny",  label: "搞笑病毒 - 反差/意外，激发分享" },
  { value: "emotional",    label: "情感共鸣 - 讲故事，触动情绪" },
  { value: "comparison",   label: "对比测评 - Before/After，碾压竞品" },
  { value: "urgency",      label: "紧迫促销 - 限时/限量，制造稀缺感" },
];

export default function NewCampaign() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const shopify = useAppBridge();

  const isLoading = navigation.state === "submitting";
  const product = actionData?.intent === "fetch_product" ? actionData?.product : null;
  const fetchError = actionData?.intent === "fetch_product" ? actionData?.error : null;

  const [productUrl,     setProductUrl]     = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [sellingPoints,  setSellingPoints]  = useState("");
  const [dailyBudget,    setDailyBudget]    = useState("20");
  const [adStyle,        setAdStyle]        = useState("");
  const [competitorRef,  setCompetitorRef]  = useState("");

  const handleFetchProduct = useCallback(() => {
    const fd = new FormData();
    fd.append("intent", "fetch_product");
    fd.append("productUrl", productUrl);
    submit(fd, { method: "post" });
  }, [productUrl, submit]);

  const handleSubmit = useCallback(() => {
    if (!product || !sellingPoints.trim() || !adStyle) {
      shopify.toast.show("请填写核心卖点并选择广告风格", { isError: true });
      return;
    }
    const fd = new FormData();
    fd.append("intent",         "create_campaign");
    fd.append("productId",      product.id);
    fd.append("productTitle",   product.title);
    fd.append("productImage",   product.images?.edges?.[0]?.node?.url || "");
    fd.append("targetAudience", targetAudience);
    fd.append("sellingPoints",  sellingPoints);
    fd.append("dailyBudget",    dailyBudget);
    fd.append("adStyle",        adStyle);
    fd.append("competitorRef",  competitorRef);
    submit(fd, { method: "post" });
  }, [product, targetAudience, sellingPoints, dailyBudget, adStyle, competitorRef, submit, shopify]);

  const price = product?.priceRangeV2?.minVariantPrice;

  return (
    <s-page heading="新建广告活动">
      <Link slot="primary-action" to="/app">
        <s-button>返回</s-button>
      </Link>

      <s-section heading="第一步：选择推广商品">
        <s-paragraph>
          输入商品的 Shopify 链接（如 https://your-store.myshopify.com/products/xxx）或直接输入商品 Handle
        </s-paragraph>

        <s-stack direction="inline" gap="base" blockAlign="end">
          <s-text-field
            label="商品链接 / Handle"
            value={productUrl}
            onInput={(e) => setProductUrl(e.target.value)}
            placeholder="https://your-store.myshopify.com/products/your-product"
            style={{ flex: 1 }}
          />
          <s-button
            onClick={handleFetchProduct}
            {...(isLoading ? { loading: true } : {})}
            disabled={!productUrl.trim()}
          >
            查询商品
          </s-button>
        </s-stack>

        {fetchError && (
          <s-banner tone="critical">
            <s-paragraph>{fetchError}</s-paragraph>
          </s-banner>
        )}

        {product && (
          <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
            <s-stack direction="inline" gap="base">
              {product.images?.edges?.[0]?.node?.url && (
                <img
                  src={product.images.edges[0].node.url}
                  alt={product.title}
                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                />
              )}
              <s-stack direction="block" gap="tight">
                <s-text fontWeight="bold">{product.title}</s-text>
                {price && (
                  <s-text>{price.currencyCode} {parseFloat(price.amount).toFixed(2)}</s-text>
                )}
                {product.tags?.length > 0 && (
                  <s-text>{product.tags.slice(0, 5).join(" · ")}</s-text>
                )}
              </s-stack>
            </s-stack>
          </s-box>
        )}
      </s-section>

      {product && (
        <s-section heading="第二步：填写推广诉求">
          <s-stack direction="block" gap="base">

            <s-text-field
              label="目标受众"
              value={targetAudience}
              onInput={(e) => setTargetAudience(e.target.value)}
              placeholder="例：25-45岁北美女性，喜欢家居装饰，有宠物"
              helpText="描述你最想触达的用户画像，越具体越好"
              multiline="2"
            />

            <s-text-field
              label="核心卖点（必填）"
              value={sellingPoints}
              onInput={(e) => setSellingPoints(e.target.value)}
              placeholder={"1. 防水材质，适合厨房使用\n2. 一键拆洗，30秒搞定\n3. 限时买二送一"}
              helpText="写出 1-3 条最打动人的卖点，AI 会把它们注入视频前3秒的 Hook"
              multiline="4"
            />

            <s-stack direction="inline" gap="base">
              <s-text-field
                label="日预算（美元）"
                value={dailyBudget}
                onInput={(e) => setDailyBudget(e.target.value)}
                type="number"
                prefix="$"
                helpText="建议新品测试从 $20-50/天 开始"
                style={{ flex: 1 }}
              />

              <s-select
                label="广告风格"
                value={adStyle}
                onChange={(e) => setAdStyle(e.target.value)}
                helpText="影响 AI 生成视频的整体基调"
                style={{ flex: 1 }}
              >
                <option value="">选择广告风格...</option>
                {AD_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </s-select>
            </s-stack>

            <s-text-field
              label="竞品参考（可选）"
              value={competitorRef}
              onInput={(e) => setCompetitorRef(e.target.value)}
              placeholder="例：https://www.amazon.com/dp/XXXXXX 或竞品名称"
              helpText="提供竞品链接，AI 会分析其广告策略并做差异化"
            />

            <s-stack direction="inline" align="end">
              <s-button
                variant="primary"
                onClick={handleSubmit}
                {...(isLoading ? { loading: true } : {})}
              >
                创建广告活动 →
              </s-button>
            </s-stack>
          </s-stack>
        </s-section>
      )}
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
