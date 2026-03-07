import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";
import bodyParser from "body-parser";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistence file paths
const SUBS_FILE = path.join(__dirname, "subscriptions.json");
const KEYS_FILE = path.join(__dirname, "vapid-keys.json");

// Load or generate VAPID keys
let vapidKeys;
if (fs.existsSync(KEYS_FILE)) {
  vapidKeys = JSON.parse(fs.readFileSync(KEYS_FILE, "utf-8"));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(KEYS_FILE, JSON.stringify(vapidKeys));
}

const publicKey = process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey;
const privateKey = process.env.VAPID_PRIVATE_KEY || vapidKeys.privateKey;
const subject = process.env.VAPID_SUBJECT || "mailto:jayanthmuddulurt2004@gmail.com";

console.log("🔑 VAPID Public Key:", publicKey.substring(0, 10) + "...");
if (!process.env.VAPID_PUBLIC_KEY) {
  console.warn("⚠️ Using generated VAPID keys. These will change on server restart unless set in environment variables.");
}

webpush.setVapidDetails(
  subject,
  publicKey,
  privateKey
);

// Load subscriptions
let subscriptions: any[] = [];
if (fs.existsSync(SUBS_FILE)) {
  try {
    subscriptions = JSON.parse(fs.readFileSync(SUBS_FILE, "utf-8"));
  } catch (e) {
    subscriptions = [];
  }
}

const saveSubscriptions = () => {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(bodyParser.json());

  // API routes
  app.get("/api/health", (req, res) => {
    console.log("🏥 Health check hit!");
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Explicitly serve manifest.json with correct MIME type
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    res.sendFile(path.join(__dirname, "public", "manifest.json"));
  });

  app.get("/api/vapid-public-key", (req, res) => {
    res.json({ publicKey });
  });

  app.post("/api/subscribe", (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription" });
    }
    
    // Check if subscription already exists
    const exists = subscriptions.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      console.log("✅ New subscription added:", subscription.endpoint.substring(0, 30) + "...");
      subscriptions.push(subscription);
      saveSubscriptions();
    } else {
      console.log("ℹ️ Subscription already exists, skipping.");
    }
    res.status(201).json({ success: true });
  });

  app.post("/api/unsubscribe", (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint required" });
    }
    
    const initialLength = subscriptions.length;
    subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
    
    if (subscriptions.length < initialLength) {
      console.log("🗑️ Subscription removed:", endpoint.substring(0, 30) + "...");
      saveSubscriptions();
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Subscription not found" });
    }
  });

  app.post("/api/test-notification", async (req, res) => {
    console.log(`🧪 Sending test notification to ${subscriptions.length} subscribers...`);
    
    const payload = JSON.stringify({
      title: "BudgetBee Test",
      body: "This is a test notification! It works!"
    });

    const invalidEndpoints: string[] = [];
    let successCount = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, payload);
          successCount++;
        } catch (err: any) {
          console.error(`❌ Error sending to ${sub.endpoint.substring(0, 20)}...`, err.statusCode, err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            invalidEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    if (invalidEndpoints.length > 0) {
      console.log(`🧹 Cleaning up ${invalidEndpoints.length} invalid subscriptions`);
      subscriptions = subscriptions.filter(s => !invalidEndpoints.includes(s.endpoint));
      saveSubscriptions();
    }

    res.json({ 
      success: true, 
      sentTo: successCount,
      total: subscriptions.length + invalidEndpoints.length,
      cleaned: invalidEndpoints.length
    });
  });

  // Hourly Reminder Logic
  setInterval(async () => {
    const payload = JSON.stringify({
      title: "BudgetBee Reminder",
      body: "If you buy anything, kindly add it to your list!"
    });

    console.log(`Sending hourly reminder to ${subscriptions.length} subscribers...`);
    
    const invalidEndpoints: string[] = [];
    
    await Promise.all(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          invalidEndpoints.push(sub.endpoint);
        }
        console.error("Error sending hourly notification", err);
      }
    }));

    if (invalidEndpoints.length > 0) {
      subscriptions = subscriptions.filter(s => !invalidEndpoints.includes(s.endpoint));
      saveSubscriptions();
    }
  }, 1000 * 60 * 60); // Every 1 hour

  // Redirect favicon.ico to icon.svg
  app.get("/favicon.ico", (req, res) => {
    res.redirect("/icon.svg");
  });

  const isProd = process.env.NODE_ENV === "production" && fs.existsSync(path.join(__dirname, "dist"));

  if (!isProd) {
    console.log("🛠️ Starting in DEVELOPMENT mode with Vite middleware");
    // Serve public directory explicitly in dev
    app.use(express.static(path.join(__dirname, "public")));

    // In development, use Vite's middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Fallback for development mode
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log("🚀 Starting in PRODUCTION mode serving from /dist");
    // In production, serve the built files
    app.use(express.static(path.join(__dirname, "dist")));
    
    // SPA fallback: serve index.html for any unknown routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is live at http://0.0.0.0:${PORT}`);
    console.log(`📂 Current directory: ${__dirname}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
