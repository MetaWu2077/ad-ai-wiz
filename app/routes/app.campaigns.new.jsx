import { useState, useCallback, useEffect } from "react";
import { redirect, useActionData, useNavigation, useSubmit, useLoaderData, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }) {
  try {
    await authenticate.admin(request);
  } catch (e) {
    return { authRequired: true };
  }
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
        productUrl:    formData.get("productUrl"),
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
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  useEffect(() => {
    if (loaderData?.authRequired) {
      window.location.href = "/auth/login";
    }
  }, [loaderData]);

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
      window.alert("请填写核心卖点并选择广告风格");
      return;
    }
    const fd = new FormData();
    fd.append("productUrl",     productUrl);
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
  }, [product, targetAudience, sellingPoints, dailyBudget, adStyle, competitorRef, submit]);

  const price = product?.priceRangeV2?.minVariantPrice;

  return (
    <div style={{ padding: "24px 0", maxWidth: 720 }}>
      <button onClick={() => navigate("/app/campaigns")} style={{ padding: "8px 16px", background: "#f6f6f7", color: "#212b36", border: "1px solid #c4cdd5", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>返回</button>

      <div style={{ marginTop: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#212b36", marginBottom: 24 }}>新建广告活动</h1>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#212b36" }}>第一步：选择推广商品</h2>
          <p style={{ color: "#697184", marginBottom: 12, fontSize: 14 }}>输入商品的 Shopify 链接或 Handle</p>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#212b36", marginBottom: 4 }}>商品链接 / Handle</label>
              <input
                type="text"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://your-store.myshopify.com/products/your-product"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #c4cdd5", borderRadius: 4, fontSize: 14 }}
              />
            </div>
            <button onClick={handleFetchProduct} disabled={!productUrl.trim() || isLoading} style={{ padding: "8px 16px", background: isLoading ? "#919eab" : "#005aff", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, cursor: isLoading ? "not-allowed" : "pointer" }}>
              {isLoading ? "查询中..." : "查询商品"}
            </button>
          </div>

          {fetchError && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#fef0f0", border: "1px solid #fed7d7", borderRadius: 4, color: "#c00", fontSize: 13 }}>
              {fetchError}
            </div>
          )}

          {product && (
            <div style={{ marginTop: 16, padding: 16, background: "#f6f6f7", border: "1px solid #c4cdd5", borderRadius: 8, display: "flex", gap: 12, alignItems: "center" }}>
              {product.images?.edges?.[0]?.node?.url && (
                <img src={product.images.edges[0].node.url} alt={product.title} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{product.title}</div>
                {price && <div style={{ fontSize: 13, color: "#697184", marginTop: 2 }}>{price.currencyCode} {parseFloat(price.amount).toFixed(2)}</div>}
                {product.tags?.length > 0 && <div style={{ fontSize: 12, color: "#919eab", marginTop: 2 }}>{product.tags.slice(0, 5).join(" · ")}</div>}
              </div>
            </div>
          )}
        </section>

        {product && (
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#212b36" }}>第二步：填写推广诉求</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#212b36", marginBottom: 4 }}>目标受众</label>
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="例：25-45岁北美女性，喜欢家居装饰，有宠物"
                  rows={2}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #c4cdd5", borderRadius: 4, fontSize: 14 }}
                />
                <div style={{ fontSize: 12, color: "#919eab", marginTop: 4 }}>描述你最想触达的用户画像，越具体越好</div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#212b36", marginBottom: 4 }}>核心卖点（必填）</label>
                <textarea
                  value={sellingPoints}
                  onChange={(e) => setSellingPoints(e.target.value)}
                  placeholder={"1. 防水材质，适合厨房使用\n2. 一键拆洗，30秒搞定\n3. 限时买二送一"}
                  rows={4}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #c4cdd5", borderRadius: 4, fontSize: 14 }}
                />
                <div style={{ fontSize: 12, color: "#919eab", marginTop: 4 }}>写出 1-3 条最打动人的卖点，AI 会把它们注入视频前3秒的 Hook</div>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#212b36", marginBottom: 4 }}>日预算（美元）</label>
                  <input
                    type="number"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(e.target.value)}
                    min="1"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #c4cdd5", borderRadius: 4, fontSize: 14 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#212b36", marginBottom: 4 }}>广告风格</label>
                  <select
                    value={adStyle}
                    onChange={(e) => setAdStyle(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #c4cdd5", borderRadius: 4, fontSize: 14 }}
                  >
                    <option value="">选择广告风格...</option>
                    {AD_STYLES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#212b36", marginBottom: 4 }}>竞品参考（可选）</label>
                <input
                  type="text"
                  value={competitorRef}
                  onChange={(e) => setCompetitorRef(e.target.value)}
                  placeholder="例：https://www.amazon.com/dp/XXXXXX 或竞品名称"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #c4cdd5", borderRadius: 4, fontSize: 14 }}
                />
                <div style={{ fontSize: 12, color: "#919eab", marginTop: 4 }}>提供竞品链接，AI 会分析其广告策略并做差异化</div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button onClick={handleSubmit} disabled={isLoading} style={{ padding: "10px 20px", background: isLoading ? "#919eab" : "#008060", color: "#fff", border: "none", borderRadius: 4, fontSize: 14, cursor: isLoading ? "not-allowed" : "pointer" }}>
                  {isLoading ? "创建中..." : "创建广告活动 →"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
