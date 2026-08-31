import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple parser for .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let appSecret = process.env.WA_APP_SECRET;
let verifyToken = process.env.WA_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN;
const appId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1647087243175531'; // using the app ID from your env/screenshots
const webhookUrl = 'https://ninoc.store/api/whatsapp/commerce/webhook';

if (!appSecret || !verifyToken) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const secretMatch = envContent.match(/WA_APP_SECRET=(.+)/);
    const verifyMatch = envContent.match(/WA_VERIFY_TOKEN=(.+)/) || envContent.match(/META_WEBHOOK_VERIFY_TOKEN=(.+)/);
    
    if (secretMatch) appSecret = secretMatch[1].replace(/["']/g, '').trim();
    if (verifyMatch) verifyToken = verifyMatch[1].replace(/["']/g, '').trim();
  } catch (e) {
    console.log("Could not read .env.local automatically.");
  }
}

if (!appSecret) {
  console.error("❌ ERROR: WA_APP_SECRET is missing. Please add it to .env.local first.");
  process.exit(1);
}

if (!verifyToken) {
  console.error("❌ ERROR: WA_VERIFY_TOKEN is missing. Please add it to .env.local first.");
  process.exit(1);
}

const accessToken = `${appId}|${appSecret}`;
const graphUrl = `https://graph.facebook.com/v19.0/${appId}/subscriptions`;

console.log(`⏳ Registering Webhook for App ID: ${appId}...`);
console.log(`🔗 Target URL: ${webhookUrl}`);

async function registerWebhook() {
  try {
    // 1. Subscribe to the webhook with fields
    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        object: 'whatsapp_business_account',
        callback_url: webhookUrl,
        verify_token: verifyToken,
        fields: 'messages',
        access_token: accessToken,
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to register Webhook:', result.error?.message || result);
      if (result.error?.message?.includes('Validation failed')) {
         console.log("\n💡 INFO: Validation failed usually means Vercel hasn't finished deploying yet, or it returned a 404/500 error during Meta's ping test. Wait 1-2 minutes and try running this script again.");
      }
    } else {
      console.log('✅ Webhook successfully registered and verified via Meta API!');
      console.log(result);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

registerWebhook();
