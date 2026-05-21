module.exports = {
  apps: [{
    name: "ad-ai-wiz",
    script: "node_modules/.bin/react-router-serve",
    args: "./build/server/index.js",
    cwd: "/root/.openclaw/workspace/ad-ai-wiz",
    env: {
      NODE_ENV: "production",
      PORT: "3459",
      SHOPIFY_API_KEY: "161e3587f555519841f6049be9c90013",
      SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
      SHOPIFY_APP_URL: "https://www.adaiwiz.com",
      SCOPES: "read_products,write_products,read_analytics,read_metaobjects,write_metaobjects",
    },
  }]
};