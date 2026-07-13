const fs = require('fs');
const axios = require('axios');

/**
 * Sends a single frame to Google's Gemini vision API (free tier, no credit card
 * required - get a key at aistudio.google.com) and asks it to identify the
 * main product shown, returning structured JSON.
 *
 * NOTE: this identifies WHAT the product is (name/category/brand/color).
 * It does not find the exact retailer listing - that's retailerMatcher.js's job.
 */
async function identifyProductInFrame(framePath) {
  const imageBase64 = fs.readFileSync(framePath).toString('base64');

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
    {
      contents: [
        {
          parts: [
            {
              text:
                'Identify the single main product being showcased in this image (e.g. from a product reel). ' +
                'Respond ONLY with JSON, no markdown fences, no extra text, in this exact shape: ' +
                '{"found": boolean, "productName": string, "category": string, "color": string, "brandGuess": string, "searchQuery": string}. ' +
                'searchQuery should be a short, generic shopping-search phrase (3-6 words) suitable for searching Amazon/Flipkart/Myntra. ' +
                'If no clear product is visible, set found to false and leave other fields as empty strings.'
            },
            {
              inline_data: { mime_type: 'image/jpeg', data: imageBase64 }
            }
          ]
        }
      ]
    },
    { headers: { 'content-type': 'application/json' } }
  );

  const rawText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return { found: false };

  try {
    // Gemini sometimes wraps JSON in ```json fences despite instructions - strip them
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse product JSON:', rawText);
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
