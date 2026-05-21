// Load environment variables from .env file
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

const app = express();

// Trust the first proxy (Plesk reverse proxy)
app.set("trust proxy", 1);

// Serve the Hugo-built static site from the public directory
app.use(express.static(path.join(__dirname, "..", "public")));

// Parse JSON and URL-encoded request bodies, capped at 10kb to prevent abuse
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Rate limiter: max 3 requests per day per IP
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many requests. Please try again later." },
});

// Configure the SMTP mail transporter using credentials from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // Use TLS for port 465, STARTTLS otherwise
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify a Cloudflare Turnstile CAPTCHA token server-side
async function verifyTurnstile(token) {
  console.log("Turnstile token length:", token?.length, "Secret loaded:", !!process.env.TURNSTILE_SECRET);
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET,
        response: token,
      }),
    }
  );
  const data = await res.json();
  if (!data.success) {
    console.error("Turnstile verification failed:", JSON.stringify(data, null, 2));
  }
  return data.success === true;
}

// POST /api/send — handles contact form submissions
app.post("/api/send", limiter, async (req, res) => {
  const { name, email, phone, message, turnstileToken } = req.body;

  // Validate that all required fields are present
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Enforce maximum field lengths to prevent oversized payloads
  if (name.length > 100 || email.length > 254 || message.length > 5000) {
    return res.status(400).json({ error: "Input too long." });
  }
  if (phone && phone.length > 30) {
    return res.status(400).json({ error: "Input too long." });
  }

  // Ensure the CAPTCHA token was submitted
  if (!turnstileToken) {
    return res.status(400).json({ error: "CAPTCHA verification required." });
  }

  // Verify the CAPTCHA token with Cloudflare
  const turnstileOk = await verifyTurnstile(turnstileToken);
  if (!turnstileOk) {
    return res.status(403).json({ error: "CAPTCHA verification failed." });
  }

  // Send the email via the configured SMTP transporter
  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.MAIL_FROM}>`,
      replyTo: email,
      to: process.env.MAIL_TO,
      subject: `Contact form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\n\n${message}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Mail error:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Treeminded.nl API listening on port ${port}`));
