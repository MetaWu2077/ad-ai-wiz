import os
import requests

# ================= 核心配置区域 =================
SHOP_URL = "adaiwiz-store.myshopify.com"
# 🔒 请把下面替换为你从本地数据库或后台拿到的真实 shpua_ 开头的 Token
ACCESS_TOKEN = "shpua_f3c7ad204f5f3f5111a6c1825c1fb78b" 
API_VERSION = "2026-04"
OUTPUT_DIR = "./comfyui_input" # 商品图下载到本地的文件夹
# ===============================================

def fetch_latest_product():
    """使用 GraphQL 抓取商店里最新创建的一个商品"""
    endpoint = f"https://{SHOP_URL}/admin/api/{API_VERSION}/graphql.json"
    
    headers = {
        "X-Shopify-Access-Token": ACCESS_TOKEN,
        "Content-Type": "application/json"
    }
    
    # 编写 GraphQL 查询语句：只抓取最新的一条商品，要它的标题、ID和主图 URL
    query = """
    {
      products(first: 1, reverse: True) {
        edges {
          node {
            id
            title
            featuredImage {
              url
            }
          }
        }
      }
    }
    """
    
    try:
        response = requests.post(endpoint, json={"query": query}, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # 解析密密麻麻的 JSON 嵌套
        products = data.get("data", {}).get("products", {}).get("edges", [])
        if not products:
            print("❌ 商店里空空如也，没有找到任何产品，快去后台再点一次生成！")
            return None
            
        product_node = products[0]["node"]
        title = product_node["title"]
        image_url = product_node.get("featuredImage", {}).get("url")
        
        print(f"🎉 成功连通管道！抓取到最新商品: 【{title}】")
        return {"title": title, "image_url": image_url}
        
    except Exception as e:
        print(f"❌ 管道握手失败，原因: {e}")
        return None

def download_image(image_url, product_title):
    """将 Shopify CDN 上的图片下载到电脑本地，准备喂给 ComfyUI"""
    if not image_url:
        print("⚠️ 该产品没有主图，无法下载。")
        return
        
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    # 清理掉文件名里不能存在的特殊字符
    clean_title = "".join([c for c in product_title if c.isalpha() or c.isdigit() or c in " ' "]).rstrip()
    local_filename = os.path.join(OUTPUT_DIR, f"{clean_title}_input.jpg")
    
    print(f"📥 正在从小克鲁苏云端下载图片: {image_url} ...")
    
    img_data = requests.get(image_url).content
    with open(local_filename, 'wb') as handler:
        handler.write(img_data)
        
    print(f"🏁 完美的闭环！商品图已成功落盘至: {os.path.abspath(local_filename)}")

if __name__ == "__main__":
    # 1. 确保安装了 requests 库 (pip install requests)
    product_info = fetch_latest_product()
    if product_info:
        # 2. 执行下载
        download_image(product_info["image_url"], product_info["title"])