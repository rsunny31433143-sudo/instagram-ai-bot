const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PAGES_DIR = path.join(__dirname, '..', 'public', 'pages');

function generateLandingPage(product, links) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
  const id = uuidv4().slice(0, 8);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(product.productName || 'Product matches')}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; color: #1a1a1a; }
  h1 { font-size: 20px; }
  .disclosure { font-size: 12px; color: #666; margin-bottom: 24px; }
  a.retailer { display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 10px;
    text-decoration: none; color: #1a1a1a; font-weight: 500; }
  a.retailer:hover { border-color: #999; }
</style>
</head>
<body>
  <h1>${escapeHtml(product.productName || 'Similar products')}</h1>
  <p class="disclosure">This page contains affiliate links. We may earn a commission on purchases at no extra cost to you.</p>
  <a class="retailer" href="${links.amazon}" target="_blank" rel="noopener">Buy on Amazon &rarr;</a>
  <a class="retailer" href="${links.flipkart}" target="_blank" rel="noopener">Buy on Flipkart &rarr;</a>
  <a class="retailer" href="${links.myntra}" target="_blank" rel="noopener">Buy on Myntra &rarr;</a>
</body>
</html>`;

  fs.writeFileSync(path.join(PAGES_DIR, `${id}.html`), html);
  return id;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

module.exports = { generateLandingPage };
