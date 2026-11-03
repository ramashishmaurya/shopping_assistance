// ShopMind AI — Universal Content Script
// Extracts product information, price, rating, reviews and specs from active shopping pages

function extractProductDetails() {
  const url = window.location.href;
  const hostname = window.location.hostname;

  let title = "";
  let price = "";
  let rating = "";
  let reviewCount = "";
  let description = "";
  let reviews = [];

  // 1. Amazon Specific Selectors
  if (hostname.includes("amazon")) {
    const titleEl = document.getElementById("productTitle");
    if (titleEl) title = titleEl.innerText.trim();

    // Price
    const priceEl = document.querySelector(".a-price .a-offscreen") ||
                    document.getElementById("priceblock_ourprice") ||
                    document.getElementById("priceblock_dealprice") ||
                    document.querySelector(".apexPriceToPay .a-offscreen");
    if (priceEl) price = priceEl.innerText.trim();

    // Rating & Review count
    const ratingEl = document.querySelector("#acrPopover .a-size-base") ||
                     document.querySelector("i.a-icon-star span.a-icon-alt");
    if (ratingEl) rating = ratingEl.innerText.trim();

    const countEl = document.getElementById("acrCustomerReviewText");
    if (countEl) reviewCount = countEl.innerText.trim();

    // Features / Bullets
    const featureEl = document.getElementById("feature-bullets");
    if (featureEl) description = featureEl.innerText.trim();

    // Reviews
    document.querySelectorAll('[data-hook="review-collapsed"], .review-text-content').forEach((el, idx) => {
      if (idx < 6 && el.innerText.trim()) reviews.push(el.innerText.trim());
    });
  }
  // 2. Flipkart Specific Selectors
  else if (hostname.includes("flipkart")) {
    const titleEl = document.querySelector(".B_NuCI, ._2lQavK, .VU-ZEz");
    if (titleEl) title = titleEl.innerText.trim();

    const priceEl = document.querySelector("._30jeq3._16Jk6d, ._30jeq3, .Nx9bqj.CxhGGd");
    if (priceEl) price = priceEl.innerText.trim();

    const ratingEl = document.querySelector("._3LWZlK, .XQDdHH");
    if (ratingEl) rating = ratingEl.innerText.trim();

    const countEl = document.querySelector("._2_R_DZ, .Wphh3L");
    if (countEl) reviewCount = countEl.innerText.trim();

    const descEl = document.querySelector("._1mXcCf, ._2-riNZ");
    if (descEl) description = descEl.innerText.trim();

    document.querySelectorAll(".ZmyHeo, ._6K-7Co").forEach((el, idx) => {
      if (idx < 6 && el.innerText.trim()) reviews.push(el.innerText.trim());
    });
  }
  // 3. Generic OpenGraph & Schema.org Fallback for other shopping stores
  else {
    // OpenGraph Title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) title = ogTitle.getAttribute("content");
    else title = document.title;

    // Price
    const ogPrice = document.querySelector('meta[property="product:price:amount"]');
    if (ogPrice) price = ogPrice.getAttribute("content");

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) description = metaDesc.getAttribute("content");
  }

  // Schema.org JSON-LD extraction fallback
  if (!title || !price) {
    try {
      document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
        const json = JSON.parse(script.innerText);
        const product = json["@type"] === "Product" ? json : (json["@graph"] ? json["@graph"].find(i => i["@type"] === "Product") : null);
        if (product) {
          if (!title && product.name) title = product.name;
          if (!description && product.description) description = product.description;
          if (!rating && product.aggregateRating) rating = String(product.aggregateRating.ratingValue);
          if (!reviewCount && product.aggregateRating) reviewCount = String(product.aggregateRating.reviewCount);
          if (!price && product.offers) {
            price = Array.isArray(product.offers) ? product.offers[0].price : product.offers.price;
          }
        }
      });
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  return {
    url,
    hostname,
    title: title || document.title,
    price: price || "Price not found",
    rating: rating || "No rating",
    reviewCount: reviewCount || "",
    description: description || "",
    reviews: reviews
  };
}

// Listen for messages from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_PRODUCT_DETAILS") {
    const data = extractProductDetails();
    sendResponse(data);
  }
  return true;
});
