const fs = require('fs');
const axios = require('axios');

/**
 * Sends a single frame to Claude's vision API and asks it to identify
 * the main product shown, returning structured JSON.
 *
 * NOTE: this identifies WHAT the product is (name/category/brand/color).
 * It does not find the exact retailer listing - that's retailerMatcher.js's job.
 */
async function identifyProductInFrame(framePath) {
  const imageBase64 = fs.readFileSync(framePath).toString('base64');

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
            },
            {
              type: 'text',
              text:
                'Identify the single main product being showcased in this image (e.g. from a product reel). ' +
                'Respond ONLY with JSON, no markdown fences, no extra text, in this exact shape: ' +
                '{"found": boolean, "productName": string, "category": string, "color": string, "brandGuess": string, "searchQuery": string}. ' +
                'searchQuery should be a short, generic shopping-search phrase (3-6 words) suitable for searching Amazon/Flipkart/Myntra. ' +
                'If no clear product is visible, set found to false and leave other fields as empty strings.'
            }
          ]
        }
      ]
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  );

  const textBlock = response.data.content.find((b) => b.type === 'text');
  if (!textBlock) return { found: false };

  try {
    return JSON.parse(textBlock.text.trim());
  } catch (err) {
    console.error('Failed to parse product JSON:', textBlock.text);
    return { found: false };
  }
}

/**
 * Runs detection across multiple frames and picks the most confident/common result.
 * Simple strategy: return the first frame where a product was found.
 * (Upgrade path: aggregate all frames and vote on the most frequent category/brand.)
 */
async function identifyProductFromFrames(framePaths) {
  for (const frame of framePaths) {
    const result = await identifyProductInFrame(frame);
    if (result.found) return result;
  }
  return { found: false };
}

module.exports = { identifyProductInFrame, identifyProductFromFrames };
