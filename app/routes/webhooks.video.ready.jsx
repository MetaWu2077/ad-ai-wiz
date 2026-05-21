import db from "../db.server";

export async function loader({ request }) {
  return new Response("Method not allowed", { status: 405 });
}

export async function action({ request }) {
  // This webhook is called by the video production system (not Shopify)
  // so we don't use the standard Shopify webhook authentication.
  // In production, you should verify the webhook secret token.
  const body = await request.json();
  const { campaign_id, video_url, thumbnail_url, status } = body;

  if (!campaign_id) {
    return Response.json({ error: "campaign_id is required" }, { status: 400 });
  }

  const campaign = await db.campaign.findUnique({ where: { id: campaign_id } });
  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  await db.campaign.update({
    where: { id: campaign_id },
    data: {
      videoUrl: video_url || null,
      thumbnailUrl: thumbnail_url || null,
      status: status || "ready",
    },
  });

  // Create a notification for the merchant
  await db.notification.create({
    data: {
      shop: campaign.shop,
      campaignId: campaign_id,
      type: "video_ready",
      title: "广告视频已制作完成",
      body: `您的广告活动「${campaign.productTitle}」的视频已生成，可以查看并投放了。`,
      read: false,
    },
  });

  return Response.json({ ok: true });
}