export const loader = async ({ request }) => {
  const url = new URL(request.url);
  return {
    message: "debug endpoint",
    shopifyReload: url.searchParams.get("shopify-reload") || "NOT_SET",
    embedded: url.searchParams.get("embedded") || "NOT_SET",
    shop: url.searchParams.get("shop") || "NOT_SET",
    session: url.searchParams.get("session") || "NOT_SET",
    host: url.searchParams.get("host") || "NOT_SET",
  };
};