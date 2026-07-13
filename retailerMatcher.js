/**
 * IMPORTANT HONESTY NOTE:
 * Exact-product matching (finding the precise SKU) requires each retailer's
 * product-search API, and those have varying access levels:
 *   - Amazon Product Advertising API: requires Associates approval + sales history
 *   - Flipkart Affiliate API: available after Flipkart affiliate approval
 *   - Myntra: no public product-search API for affiliates
 *
 * This starter uses SEARCH-RESULT affiliate links instead - i.e. the user lands
 * on a search results page for the detected product on each site, with your
 * affiliate tag attached. This works immediately after each affiliate program
 * approves you, and commission is still tracked on any purchase made after
 * clicking through. Upgrade to exact-SKU matching later once you have API access.
 */

function buildAmazonLink(searchQuery) {
  const tag = process.env.AMAZON_ASSOCIATE_TAG;
  const q = encodeURIComponent(searchQuery);
  return `https://www.amazon.in/s?k=${q}${tag ? `&tag=${tag}` : ''}`;
}

function buildFlipkartLink(searchQuery) {
  const affId = process.env.FLIPKART_AFFILIATE_ID;
  const q = encodeURIComponent(searchQuery);
  // Flipkart affiliate deep links are generated via their affiliate dashboard/API;
  // this is the basic search URL pattern to start with.
  return `https://www.flipkart.com/search?q=${q}${affId ? `&affid=${affId}` : ''}`;
}

function buildMyntraLink(searchQuery) {
  const affId = process.env.MYNTRA_AFFILIATE_ID;
  const q = encodeURIComponent(searchQuery);
  return `https://www.myntra.com/${q.replace(/%20/g, '-')}${affId ? `?affid=${affId}` : ''}`;
}

function buildRetailerLinks(searchQuery) {
  return {
    amazon: buildAmazonLink(searchQuery),
    flipkart: buildFlipkartLink(searchQuery),
    myntra: buildMyntraLink(searchQuery)
  };
}

module.exports = { buildRetailerLinks };
