# Instagram AI Affiliate Bot — starter backend

Flow: user DMs a reel → server downloads it → extracts frames → Claude vision
identifies the product → builds Amazon/Flipkart/Myntra affiliate search links →
generates a landing page → replies to the user with the link.

## Prerequisites on your machine/server
- Node.js 18+
- `ffmpeg` and `ffprobe` installed (`apt install ffmpeg` on Ubuntu/Debian, or use a hosting provider whose buildpack includes it)

## Setup

```bash
npm install
cp .env.example .env
# fill in every value in .env - see comments in that file for where each one comes from
npm start
```

## Fill in `.env` (see plan document for full context on each step)

| Variable | Where to get it |
|---|---|
| `IG_PAGE_ACCESS_TOKEN`, `IG_BUSINESS_ACCOUNT_ID` | developers.facebook.com, after Meta approves `instagram_manage_messages` |
| `WEBHOOK_VERIFY_TOKEN` | Any string you make up — enter the same string in Meta's webhook config screen |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `AMAZON_ASSOCIATE_TAG` | Amazon Associates dashboard, after approval |
| `FLIPKART_AFFILIATE_ID` | Flipkart Affiliate dashboard, after approval |
| `MYNTRA_AFFILIATE_ID` | Myntra affiliate/partner program, after approval |
| `PUBLIC_BASE_URL` | Your deployed server's public URL (Railway/Render give you one automatically) |

## Deploying

Any Node-friendly host works (Railway, Render, Fly.io). Steps are roughly the same everywhere:
1. Push this folder to a GitHub repo
2. Connect the repo to your hosting provider
3. Add all `.env` values as environment variables in the provider's dashboard
4. Make sure `ffmpeg` is available (Railway/Render's default Node buildpack does NOT include it — you may need a Docker deploy with an `apt-get install ffmpeg` step, or a buildpack that adds it)
5. Once deployed, copy your app's public URL into Meta's webhook config as the Callback URL, with path `/webhook`, and use your `WEBHOOK_VERIFY_TOKEN` as the Verify Token

## Known limitations of this starter (see plan doc for details)
- Product matching uses AI vision + search-query links, not exact-SKU matching — expect "similar product" quality at launch, not guaranteed exact match
- Retailer links are search-result pages with your affiliate tag attached, not deep product links — upgrade to each retailer's product-search API once you have that access
- No rate-limit queueing yet — add a simple in-memory or Redis queue before going live on an account with meaningful traffic, to stay under Instagram's ~200 DMs/hour pacing
- No persistent database — landing pages are just static files; add a DB if you want analytics on clicks/conversions
