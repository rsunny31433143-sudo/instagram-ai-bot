require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { downloadVideo, extractFrames } = require('./services/videoProcessor');
const { identifyProductFromFrames } = require('./services/productDetector');
const { buildRetailerLinks } = require('./services/retailerMatcher');
const { generateLandingPage } = require('./services/landingPage');
const { sendTextMessage } = require('./services/instagramDM');

const app = express();
app.use(express.json());
app.use('/pages', express.static(path.join(__dirname, 'public', 'pages')));

// ---- 1. Webhook verification (Meta calls this once when you set up the webhook) ----
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ---- 2. Webhook receiver (Meta POSTs here whenever a user DMs your account) ----
app.post('/webhook', async (req, res) => {
  // Respond immediately - Meta requires a fast 200, processing happens after
  res.sendStatus(200);

  try {
    const entries = req.body.entry || [];
    for (const entry of entries) {
      const messaging = entry.messaging || [];
      for (const event of messaging) {
        await handleIncomingMessage(event);
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }
});

// ---- 3. Core orchestration: reel in -> AI detection -> landing page -> DM reply ----
async function handleIncomingMessage(event) {
  const senderId = event.sender && event.sender.id;
  const attachments = event.message && event.message.attachments;

  if (!senderId || !attachments || !attachments.length) return;

  const videoAttachment = attachments.find((a) => a.type === 'video' || a.type === 'ig_reel');
  if (!videoAttachment) {
    await sendTextMessage(senderId, 'Please share a product reel or video and I will find where to buy it.');
    return;
  }

  const videoUrl = videoAttachment.payload && videoAttachment.payload.url;
  if (!videoUrl) return;

  const jobId = uuidv4().slice(0, 8);
  const tmpDir = path.join(__dirname, 'tmp', jobId);
  fs.mkdirSync(tmpDir, { recursive: true });
  const videoPath = path.join(tmpDir, 'input.mp4');

  try {
    await sendTextMessage(senderId, 'Reel mil gayi! Product scan kar raha hoon, thoda wait karein...');

    await downloadVideo(videoUrl, videoPath);
    const frames = await extractFrames(videoPath, tmpDir, 5);

    const product = await identifyProductFromFrames(frames);
    if (!product.found) {
      await sendTextMessage(senderId, 'Mujhe is video mein product clearly nahi dikha. Kya aap koi clearer reel bhej sakte hain?');
      return;
    }

    const links = buildRetailerLinks(product.searchQuery || product.productName);
    const pageId = generateLandingPage(product, links);
    const landingUrl = `${process.env.PUBLIC_BASE_URL}/pages/${pageId}.html`;

    await sendTextMessage(
      senderId,
      `Mila! "${product.productName}" - yahan Amazon, Flipkart aur Myntra ke options hain: ${landingUrl}`
    );
  } catch (err) {
    console.error('Error processing message:', err);
    await sendTextMessage(senderId, 'Kuch gadbad ho gayi, thodi der baad phir try karein.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
