import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";
import { Button } from "@shopify/polaris";
import translations from "@shopify/polaris/locales/en.json";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <PolarisAppProvider i18n={translations}>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f6f7" }}>
        <div style={{ background: "#fff", padding: 40, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", width: 360 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, textAlign: "center", color: "#212b36" }}>Ad AI Wiz</h1>
          <Form method="post">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#212b36" }}>Shop domain</label>
              <input
                name="shop"
                type="text"
                value={shop}
                onChange={(e) => setShop(e.currentTarget.value)}
                placeholder="your-store.myshopify.com"
                autoComplete="on"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #c4cdd5", borderRadius: 4, fontSize: 14, boxSizing: "border-box" }}
              />
              {errors?.shop && (
                <div style={{ color: "#c00", fontSize: 12, marginTop: 4 }}>{errors.shop}</div>
              )}
            </div>
            <Button variant="primary" submit fullWidth>
              Log in
            </Button>
          </Form>
        </div>
      </div>
    </PolarisAppProvider>
  );
}
