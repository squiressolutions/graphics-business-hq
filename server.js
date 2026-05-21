import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { Resend } from 'resend';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';

// ─── Client ───────────────────────────────────────────────────────────────────

let _client = null;
function getClient() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

let _stripe = null;
function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// ─── Site URL (update SITE_URL env var when custom domain is set) ─────────────
const SITE_URL = process.env.SITE_URL || 'https://graphics-business-hq.onrender.com'

// ─── Service Catalog (used by Stripe + portal) ────────────────────────────────

export const SERVICE_CATALOG = [
  // ── Packages ──────────────────────────────────────────────────────────────
  { id: 'starter',       name: 'Starter Package',      price: 49700,  originalPrice: 65000,  category: 'package',  description: 'Logo design (2 concepts), brand color palette, typography, 2 revision rounds.' },
  { id: 'studio',        name: 'Studio Package',        price: 119700, originalPrice: 150000, category: 'package',  description: 'Logo (3 concepts), color palette, typography, social media kit, brand guidelines PDF, 4 revision rounds.' },
  { id: 'agency',        name: 'Agency Package',        price: 369700, originalPrice: 520000, category: 'package',  description: 'Logo (5 concepts), full brand identity, social kit, guidelines, source files, unlimited revisions.' },
  // ── À la carte services ───────────────────────────────────────────────────
  { id: 'brand-identity',   name: 'Brand Identity',       price: 23500,  originalPrice: 55000,  category: 'service', description: 'Full brand system — logo, colors, typography, guidelines.' },
  { id: 'logo-design',      name: 'Logo Design',           price: 25000,  originalPrice: 49000,  category: 'service', description: 'Professional logo concepts with revisions & source files.' },
  { id: 'social-media-kit', name: 'Social Media Kit',      price: 39900,  originalPrice: 50000,  category: 'service', description: 'Templates & graphics for Instagram, TikTok, Facebook.' },
  { id: 'website-design',   name: 'Website Design',        price: 119900, originalPrice: 180000, category: 'service', description: 'UI/UX mockups, landing pages & full site designs (up to 5 pages).' },
  { id: 'print-design',     name: 'Print & Packaging',     price: 79900,  originalPrice: 100000, category: 'service', description: 'Business cards, flyers, packaging, signage & more.' },
  { id: 'ad-creative',      name: 'Ad Creative',           price: 29900,  originalPrice: 40000,  category: 'service', description: 'Meta, TikTok & Google ad graphics and copy.' },
  { id: 'motion-graphics',  name: 'Motion Graphics',       price: 59900,  originalPrice: 80000,  category: 'service', description: 'Animated logos, video intros, reels & short-form content.' },
  { id: 'full-rebrand',     name: 'Full Rebrand',          price: 369700, originalPrice: 520000, category: 'service', description: 'Complete overhaul — strategy, identity, collateral & rollout.' },
  // ── Add-ons ───────────────────────────────────────────────────────────────
  { id: 'brand-strategy',   name: 'Brand Strategy Session (2hr)', price: 29900, originalPrice: 40000, category: 'addon', description: '2-hour deep-dive brand strategy session.' },
  { id: 'logo-animation',   name: 'Motion Logo Animation',        price: 59900, originalPrice: 80000, category: 'addon', description: 'Professional animated version of your logo.' },
  { id: 'photo-direction',  name: 'Brand Photography Direction',  price: 49900, originalPrice: 65000, category: 'addon', description: 'Art direction for brand photo shoot.' },
];

// ─── Agent Definitions ────────────────────────────────────────────────────────

const AGENTS = {
  brandStudio: {
    name: 'Brand Studio',
    systemPrompt:
      'You are a senior brand identity designer. You create complete brand systems. Always return valid JSON.',
  },
  socialContent: {
    name: 'Social Content',
    systemPrompt:
      'You are a social media strategist and content creator for design/creative businesses. Return valid JSON.',
  },
  clientBrief: {
    name: 'Client Brief',
    systemPrompt:
      'You are a professional project manager for a graphic design agency. You convert client intake into detailed briefs. Return valid JSON.',
  },
  adCreative: {
    name: 'Ad Creative',
    systemPrompt:
      'You are a performance creative strategist specializing in visual ad concepts for design businesses. Return valid JSON.',
  },
  contentWriter: {
    name: 'Content Writer',
    systemPrompt:
      'You are a copywriter for creative agencies. You write portfolio case studies, website copy, and proposals. Return valid JSON.',
  },
  pricing: {
    name: 'Pricing',
    systemPrompt:
      'You are a pricing consultant for freelance graphic designers and agencies. Return valid JSON.',
  },
  prospector: {
    name: 'Prospector',
    systemPrompt:
      'You are a B2B sales strategist for a graphic design / creative agency. You specialize in identifying ideal clients and writing high-converting cold outreach. Return valid JSON.',
  },
  campaign: {
    name: 'Campaign',
    systemPrompt:
      'You are a paid media strategist for creative service businesses. You build complete ad campaign structures. Return valid JSON.',
  },
  contracts: {
    name: 'Contract Builder',
    systemPrompt:
      'You are a legal document specialist for creative agencies and freelancers. You draft professional client service agreements. Return valid JSON with a single key "contractText" containing the full contract as a plain-text string.',
  },
};

// ─── Client Intake Persistence ────────────────────────────────────────────────

const __dirnameEarly = dirname(fileURLToPath(import.meta.url));
const DATA_DIR       = join(__dirnameEarly, 'data');
const UPLOADS_DIR    = join(DATA_DIR, 'uploads');
const DELIVERIES_DIR = join(DATA_DIR, 'deliveries');
const SUBMISSIONS_FILE  = join(DATA_DIR, 'submissions.json');
const DELIVERIES_FILE   = join(DATA_DIR, 'deliveries.json');
const UPLOADS_META_FILE = join(DATA_DIR, 'uploads.json');

// Ensure directories exist
mkdirSync(UPLOADS_DIR,    { recursive: true });
mkdirSync(DELIVERIES_DIR, { recursive: true });

function loadSubmissions() {
  try { return JSON.parse(readFileSync(SUBMISSIONS_FILE, 'utf8')); } catch { return []; }
}
function saveSubmissions(data) {
  try { mkdirSync(DATA_DIR, { recursive: true }); writeFileSync(SUBMISSIONS_FILE, JSON.stringify(data, null, 2)); } catch {}
}

function loadDeliveries() {
  try { return JSON.parse(readFileSync(DELIVERIES_FILE, 'utf8')); } catch { return []; }
}
function saveDeliveries(data) {
  try { writeFileSync(DELIVERIES_FILE, JSON.stringify(data, null, 2)); } catch {}
}

function loadUploadsMeta() {
  try { return JSON.parse(readFileSync(UPLOADS_META_FILE, 'utf8')); } catch { return []; }
}
function saveUploadsMeta(data) {
  try { writeFileSync(UPLOADS_META_FILE, JSON.stringify(data, null, 2)); } catch {}
}

let submissions  = loadSubmissions();
let deliveries   = loadDeliveries();
let uploadsMeta  = loadUploadsMeta();

// ─── Multer (file uploads) ────────────────────────────────────────────────────
// NOTE: Render's filesystem is ephemeral — files are lost on redeploy.
// TODO: swap multer disk storage for S3 / Supabase Storage / Firebase Storage
//       when a persistent storage backend is available.

const ALLOWED_MIME  = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per file
const MAX_TOTAL     = 50 * 1024 * 1024; // 50 MB total per submission

function multerDiskStorage(dest) {
  return multer.diskStorage({
    destination: dest,
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}_${safe}`);
    },
  });
}

const clientUpload   = multer({ storage: multerDiskStorage(UPLOADS_DIR),    limits: { fileSize: MAX_FILE_SIZE, files: 5 }, fileFilter: typeGuard });
const deliveryUpload = multer({ storage: multerDiskStorage(DELIVERIES_DIR), limits: { fileSize: MAX_FILE_SIZE, files: 1 }, fileFilter: typeGuard });

function typeGuard(_req, file, cb) {
  if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
  else cb(Object.assign(new Error('Only PNG, JPEG, and PDF files are accepted.'), { code: 'INVALID_TYPE' }));
}

function makeRefNum() {
  return 'REQ-' + String(Date.now()).slice(-6) + Math.random().toString(36).slice(2, 5).toUpperCase();
}

// ─── Email Notifications ──────────────────────────────────────────────────────

async function sendIntakeNotification(entry) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if not configured

  const resend = new Resend(apiKey);
  const isConsult = entry.type === 'consultation';
  const subject = isConsult
    ? `New Consultation Request — ${entry.name || 'Unknown'} (${entry.refNum})`
    : `New Client Request — ${entry.name || 'Unknown'} (${entry.refNum})`;

  const rows = [
    ['Type',       isConsult ? 'Free Consultation' : 'Project Request'],
    ['Ref #',      entry.refNum],
    ['Name',       entry.name || '—'],
    ['Email',      entry.email || '—'],
    ['Phone',      entry.phone || '—'],
    ['Business',   entry.business || '—'],
    ['Website',    entry.website || '—'],
    ['Services',   (entry.services || []).join(', ') || '—'],
    ...(isConsult ? [
      ['Topic',          entry.topic || '—'],
      ['Preferred Time', entry.preferredTime || '—'],
    ] : [
      ['Budget',   entry.budget || '—'],
      ['Timeline', entry.timeline || '—'],
      ['Description', entry.description || '—'],
    ]),
    ['Found via',  entry.hearAbout || '—'],
    ['Submitted',  new Date(entry.submittedAt).toLocaleString()],
  ];

  const tableRows = rows.map(([k, v]) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#6888A8;white-space:nowrap;font-weight:600;font-size:13px;vertical-align:top;">${k}</td><td style="padding:6px 0;color:#1a1a1a;font-size:13px;">${v}</td></tr>`
  ).join('');

  const html = `
  <div style="background:#f9f9f9;padding:32px;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:#050C1A;border-radius:10px 10px 0 0;padding:20px 24px;margin-bottom:0;">
      <div style="font-size:22px;font-weight:900;color:#D4A017;letter-spacing:3px;">SQUIRES SOLUTIONS</div>
      <div style="font-size:12px;color:#6888A8;margin-top:2px;">${isConsult ? 'New Consultation Request' : 'New Client Request'}</div>
    </div>
    <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:0 0 10px 10px;padding:24px;">
      <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee;">
        <a href="${SITE_URL}/client-requests"
           style="display:inline-block;background:#D4A017;color:#0a0a0a;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;letter-spacing:.5px;">
          View in Admin →
        </a>
      </div>
    </div>
    <div style="font-size:11px;color:#999;margin-top:14px;text-align:center;">
      Squires Solutions · squiressolutions@gmail.com · Auto-notification
    </div>
  </div>`;

  try {
    await resend.emails.send({
      from: 'Squires Solutions <onboarding@resend.dev>',
      to: 'squiressolutions@gmail.com',
      subject,
      html,
    });
    console.log('[email] Notification sent for', entry.refNum);
  } catch (err) {
    console.error('[email] Failed to send notification:', err.message);
  }
}

// ─── Job Log ──────────────────────────────────────────────────────────────────

let jobs = [];

function parseJobOutput(job) {
  const text = job.output ?? '';
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return JSON.parse(fenced[1].trim());
  const bare = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (bare) return JSON.parse(bare[0]);
  throw new Error('No JSON found in agent output');
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function runAgent(agentId, userPrompt, maxTokens = 2000) {
  const agent = AGENTS[agentId];
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    agentName: agent.name,
    status: 'running',
    input: userPrompt,
    output: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };

  jobs.push(job);

  try {
    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: agent.systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find((b) => b.type === 'text')?.text ?? '';

    job.output = text;
    job.status = 'done';
    job.finishedAt = new Date().toISOString();

    return job;
  } catch (err) {
    job.status = 'error';
    job.error = err.message;
    job.finishedAt = new Date().toISOString();
    throw err;
  }
}

// ─── Autopilot ────────────────────────────────────────────────────────────────

let autopilot = { enabled: false, intervalMs: 60 * 60 * 1000, timer: null };

function startAutopilot() {
  if (autopilot.timer) {
    clearInterval(autopilot.timer);
  }

  autopilot.timer = setInterval(async () => {
    try {
      await runAgent(
        'socialContent',
        'Generate 3 Instagram post ideas for a graphic design business today.',
      );
    } catch (_) {
      // errors are captured in the job record
    }
  }, autopilot.intervalMs);
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// ─── Jobs ─────────────────────────────────────────────────────────────────────

app.get('/api/jobs', (_req, res) => {
  const recent = [...jobs].reverse().slice(0, 50);
  res.json(recent);
});

app.delete('/api/jobs', (_req, res) => {
  jobs = [];
  res.json({ cleared: true });
});

// ─── Autopilot ────────────────────────────────────────────────────────────────

app.get('/api/autopilot', (_req, res) => {
  res.json({ enabled: autopilot.enabled, intervalMs: autopilot.intervalMs });
});

app.post('/api/autopilot', (req, res) => {
  const { enabled, intervalMs } = req.body;

  if (typeof intervalMs === 'number') {
    autopilot.intervalMs = intervalMs;
  }

  if (enabled && !autopilot.enabled) {
    autopilot.enabled = true;
    startAutopilot();
  } else if (!enabled && autopilot.enabled) {
    autopilot.enabled = false;
    if (autopilot.timer) {
      clearInterval(autopilot.timer);
      autopilot.timer = null;
    }
  }

  res.json({ enabled: autopilot.enabled, intervalMs: autopilot.intervalMs });
});

// ─── Brand Studio ─────────────────────────────────────────────────────────────

app.post('/api/brand-studio', async (req, res) => {
  const { businessName, industry, targetAudience, vibe, competitors } = req.body;

  const prompt = `Create a complete brand identity system for the following business:

Business Name: ${businessName}
Industry: ${industry}
Target Audience: ${targetAudience}
Desired Vibe/Personality: ${vibe}
Competitors: ${competitors}

Return a JSON object with these exact keys:
- brandName (string)
- tagline (string)
- brandVoice (array of 3 adjectives)
- colorPalette (array of 5 objects, each with: hex, name, usage)
- typography (object with: headingFont, bodyFont, accentFont, rationale)
- logoConceptIdeas (array of 3 objects, each with: name, description, style, symbolism)
- brandPersonality (paragraph string)
- competitorDifferentiation (paragraph string)`;

  try {
    const job = await runAgent('brandStudio', prompt, 2000);
    res.json(parseJobOutput(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Social Content ───────────────────────────────────────────────────────────

app.post('/api/social-content', async (req, res) => {
  const { businessName, niche, platform, postsCount, contentTheme } = req.body;

  const prompt = `Create ${postsCount || 5} social media posts for:

Business: ${businessName}
Niche: ${niche}
Platform: ${platform}
Content Theme: ${contentTheme}

Return a JSON array of posts. Each post object must have these exact keys:
- platform (string)
- caption (string)
- hashtags (array of strings)
- visualConcept (string)
- postType (string)
- callToAction (string)
- bestTimeToPost (string)`;

  try {
    const job = await runAgent('socialContent', prompt, 2000);
    res.json(parseJobOutput(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Client Brief ─────────────────────────────────────────────────────────────

app.post('/api/client-brief', async (req, res) => {
  const { clientName, projectType, budget, timeline, goals, references } = req.body;

  const prompt = `Convert this client intake into a detailed project brief:

Client Name: ${clientName}
Project Type: ${projectType}
Budget: ${budget}
Timeline: ${timeline}
Goals: ${goals}
References/Inspiration: ${references}

Return a JSON object with these exact keys:
- projectTitle (string)
- clientOverview (string)
- objectives (array of strings)
- deliverables (array of strings)
- projectScope (string)
- outOfScope (array of strings)
- timeline (array of milestone objects with: milestone, dueDate, description)
- budget (string)
- revisionPolicy (string)
- successMetrics (array of strings)`;

  try {
    const job = await runAgent('clientBrief', prompt, 2000);
    res.json(parseJobOutput(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Ad Creative ──────────────────────────────────────────────────────────────

app.post('/api/ad-creative', async (req, res) => {
  const { businessName, service, targetAudience, budget, platform, goal } = req.body;

  const prompt = `Develop an ad creative strategy for:

Business: ${businessName}
Service: ${service}
Target Audience: ${targetAudience}
Ad Budget: ${budget}
Platform: ${platform}
Campaign Goal: ${goal}

Return a JSON object with these exact keys:
- campaignConcept (string)
- adVariants (array of exactly 3 objects, each with: headline, primaryText, visualConcept, cta, targetingNotes)
- copywritingAngles (array of 3 short angle strings)`;

  try {
    const job = await runAgent('adCreative', prompt, 2000);
    res.json(parseJobOutput(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Content Writer ───────────────────────────────────────────────────────────

app.post('/api/content-writer', async (req, res) => {
  const { type, projectName, clientIndustry, results, services } = req.body;

  const prompt = `Write the following content for a creative agency:

Content Type: ${type} (one of: caseStudy, portfolioBio, websiteCopy, serviceDescription)
Project/Company Name: ${projectName}
Client Industry: ${clientIndustry}
Results Achieved: ${results}
Services Provided: ${services}

Return a JSON object with these exact keys:
- type (string — same as the content type requested)
- title (string)
- content (string — full written content)
- seoTitle (string)
- seoDescription (string)
- wordCount (number)`;

  try {
    const job = await runAgent('contentWriter', prompt, 2000);
    res.json(parseJobOutput(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Pricing ──────────────────────────────────────────────────────────────────

app.post('/api/pricing', async (req, res) => {
  const { projectType, scope, timeline, revisions, clientType, yourRate } = req.body;

  const prompt = `Provide professional pricing guidance for this design project:

Project Type: ${projectType}
Project Scope: ${scope}
Timeline: ${timeline}
Number of Revisions: ${revisions}
Client Type: ${clientType}
Designer's Hourly Rate: ${yourRate}

Return a JSON object with these exact keys:
- projectName (string)
- basePrice (number)
- recommendedPrice (number)
- priceRange (object with: low, high — both numbers)
- breakdown (array of line item objects, each with: item, hours, rate, total)
- proposalText (string — 150-word formal proposal paragraph)
- paymentStructure (string)
- notes (string)`;

  try {
    const job = await runAgent('pricing', prompt, 2000);
    res.json(parseJobOutput(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Prospector ───────────────────────────────────────────────────────────────

app.post('/api/prospector', async (req, res) => {
  const { service, targetIndustry, location, clientBudgetRange } = req.body;

  const prompt = `Build a complete B2B client prospecting and outreach kit for a graphic design / creative agency with the following details:

Service Offered: ${service}
Target Industry: ${targetIndustry}
Location/Market: ${location}
Client Budget Range: ${clientBudgetRange}

Return a JSON object with these exact keys:

- icp (object with: title (string — the job title or business role of the ideal client), description (string — 2-3 sentence profile of this person/company), painPoints (array of exactly 5 strings — specific pain points this ICP has around design/branding), triggers (array of exactly 3 strings — buying triggers or events that make them ready to hire a designer right now), avgProjectValue (string — estimated average project value for this ICP))

- prospectTypes (array of exactly 10 objects, each with: businessType (string), whyTheyNeedDesign (string — specific reason this business type needs design services), estimatedBudget (string), whereToFindThem (string — specific places/platforms/methods to find and reach this business type))

- coldEmail (object with: subjectLines (array of exactly 5 strings — subject line variants, each under 60 characters, curiosity-driven or benefit-led), body (string — complete ready-to-send cold email approximately 150 words, written in PAS framework (Problem-Agitate-Solution), no fluff, conversational but professional, uses [FIRST_NAME] and [BUSINESS_NAME] placeholders, ends with a single low-friction CTA), ps (string — a P.S. line under 30 words that adds urgency or social proof))

- linkedinOutreach (object with: connectionRequest (string — under 300 characters, personalized, not salesy, references something specific about their industry), followUpMessage (string — approximately 100 words, sent 3 days after connecting, provides value before pitching, soft CTA), valuePostIdea (string — a content post idea/hook that would organically attract this ICP as followers or inbound leads))

- followUpSequence (array of exactly 3 objects, each with: day (number — 3, 7, or 14), subject (string — follow-up email subject line), body (string — follow-up email body under 100 words, each using a different angle: Day 3 = social proof/case study angle, Day 7 = different value proposition angle, Day 14 = breakup/last touch angle))

- objectionHandling (array of exactly 5 objects, each with: objection (string — a common sales objection such as "too expensive", "we have someone internal", "not the right time", "need to think about it", "not sure we need this"), response (string — a confident, empathetic 2-3 sentence reframe or counter that keeps the conversation going without being pushy))`;

  try {
    const job = await runAgent('prospector', prompt, 6000);
    res.json(parseJobOutput(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Campaign ─────────────────────────────────────────────────────────────────

app.post('/api/campaign', async (req, res) => {
  const { businessName, service, targetAudience, monthlyBudget, goal, platforms } = req.body;

  const prompt = `Build a complete paid advertising campaign structure for the following creative service business:

Business Name: ${businessName}
Service: ${service}
Target Audience: ${targetAudience}
Monthly Budget: ${monthlyBudget}
Campaign Goal: ${goal}
Platforms: ${platforms}

Return a JSON object with these exact keys:

- campaignStrategy (object with: overview (string — 2-3 sentence summary of the overall strategy), objective (string — the primary campaign objective e.g. lead generation, brand awareness, conversions), kpis (array of strings — 4-6 key performance indicators to track), budgetAllocation (object — platform names as keys, each with a percentage and dollar amount based on the monthly budget provided))

- meta (object with: campaignStructure (string — describes the campaign > adset > ad hierarchy, naming conventions, and how to organize it), audiences (array of exactly 3 objects, each with: name (string), type (string — e.g. "Lookalike", "Interest-based", "Retargeting"), targeting (string — specific targeting parameters to set), estimatedSize (string — approximate audience size range)), creativeSpecs (array of ad format objects, each with: format (string), dimensions (string), copySpecs (string — character limits and copy guidelines)), bidStrategy (string — recommended bid strategy and why), dailyBudget (string — recommended daily budget for Meta based on the monthly budget), setupSteps (array of strings — numbered exact steps to create this campaign in Meta Ads Manager from scratch))

- google (object with: campaignType (string — recommended Google campaign type and why), keywords (array of exactly 20 strings — target keywords to bid on), negativeKeywords (array of exactly 10 strings — keywords to exclude), adGroups (array of exactly 3 objects, each with: name (string), keywords (array of strings — 5-7 keywords for this group), headlines (array of exactly 3 strings — responsive search ad headlines under 30 chars each), descriptions (array of exactly 2 strings — ad descriptions under 90 chars each)), bidStrategy (string — recommended bid strategy), dailyBudget (string — recommended daily budget for Google based on the monthly budget), setupSteps (array of strings — numbered exact steps to create this campaign in Google Ads from scratch))

- creativeIdeas (array of exactly 5 objects, each with: platform (string), format (string — e.g. "Single Image", "Video", "Carousel"), hook (string — the first line or opening frame that stops the scroll), visual (string — description of what the visual/creative should look like), copy (string — the ad body copy), cta (string — call to action text))

- utmParameters (object with: exampleUrl (string — a full example URL with UTM parameters filled in), breakdown (object — each UTM parameter as a key with a string explanation of what it tracks and what value was used))

- timeline (array of exactly 4 objects, each with: week (string — "Week 1", "Week 2", etc.), focus (string — the primary focus for that week), tasks (array of strings — specific action items to complete that week to launch and optimize the campaign))`;

  try {
    const job = await runAgent('campaign', prompt, 8000);
    res.json(parseJobOutput(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Client Intake ────────────────────────────────────────────────────────────

app.post('/api/client-intake', (req, res) => {
  const { services, budget, timeline, description, inspiration, hearAbout,
    name, business, email, phone, website, type, preferredTime, topic } = req.body;

  const entry = {
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    refNum: makeRefNum(),
    status: 'new',
    type: type || 'project',
    submittedAt: new Date().toISOString(),
    services: Array.isArray(services) ? services : [],
    budget: budget || '',
    timeline: timeline || '',
    description: description || '',
    inspiration: inspiration || '',
    hearAbout: hearAbout || '',
    name: name || '',
    business: business || '',
    email: email || '',
    phone: phone || '',
    website: website || '',
    preferredTime: preferredTime || '',
    topic: topic || '',
  };

  submissions.unshift(entry);
  saveSubmissions(submissions);
  sendIntakeNotification(entry).catch(() => {}); // fire-and-forget
  res.json({ id: entry.id, refNum: entry.refNum });
});

app.get('/api/client-intake', (_req, res) => {
  res.json(submissions);
});

app.patch('/api/client-intake/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const idx = submissions.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  submissions[idx] = { ...submissions[idx], status };
  saveSubmissions(submissions);
  res.json(submissions[idx]);
});

app.delete('/api/client-intake/:id', (req, res) => {
  const { id } = req.params;
  submissions = submissions.filter(s => s.id !== id);
  saveSubmissions(submissions);
  res.json({ deleted: true });
});

// ─── Contract Builder ─────────────────────────────────────────────────────────

app.post('/api/contracts', async (req, res) => {
  const { clientName, clientEmail, clientBusiness, projectType, projectScope,
    totalPrice, depositPercent, startDate, deliveryDate, revisions, paymentTerms, extraClauses } = req.body;

  const deposit = totalPrice
    ? `$${(parseFloat(String(totalPrice).replace(/,/g, '')) * (parseInt(depositPercent) / 100)).toFixed(2)}`
    : `${depositPercent}% of total`;

  const prompt = `Draft a professional client service agreement for a graphic design / creative agency named Squires Solutions (squiressolutions@gmail.com).

Contract Details:
- Client Name: ${clientName}
- Client Email: ${clientEmail || 'N/A'}
- Client Business: ${clientBusiness || 'N/A'}
- Project Type: ${projectType}
- Project Scope: ${projectScope || 'As discussed'}
- Total Price: $${totalPrice}
- Deposit Required: ${deposit} (${depositPercent}% upfront before work begins)
- Start Date: ${startDate || 'Upon signed agreement'}
- Delivery Date: ${deliveryDate || 'To be determined'}
- Revision Rounds: ${revisions}
- Payment Terms: ${paymentTerms}
- Additional Clauses: ${extraClauses || 'None'}

The contract must include sections for:
1. Parties & Project Overview
2. Scope of Work & Deliverables
3. Timeline & Milestones
4. Pricing, Deposit & Payment Schedule
5. Revision Policy
6. Intellectual Property & Usage Rights
7. Confidentiality
8. Cancellation & Refund Policy
9. Limitation of Liability
10. Signatures (with blank lines for both parties)

Write in formal but clear legal language. Include date and signature blocks at the end. Return JSON with key "contractText" containing the full contract as plain text (use newlines for formatting, no markdown).`;

  try {
    const job = await runAgent('contracts', prompt, 4000);
    res.json(parseJobOutput(job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stripe Checkout ──────────────────────────────────────────────────────────

const appUrl = () => process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`;

// Return catalog to frontend
app.get('/api/services', (_req, res) => {
  res.json(SERVICE_CATALOG);
});

app.get('/api/stripe-status', (_req, res) => {
  res.json({ configured: !!process.env.STRIPE_SECRET_KEY });
});

// Buy a specific service by catalog ID
app.post('/api/checkout/service', async (req, res) => {
  const { serviceId, clientEmail, quantity = 1 } = req.body;
  const service = SERVICE_CATALOG.find(s => s.id === serviceId);
  if (!service) return res.status(400).json({ error: 'Unknown service ID.' });
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${service.name} — Squires Solutions`,
            description: service.description,
          },
          unit_amount: service.price,
        },
        quantity,
      }],
      mode: 'payment',
      customer_email: clientEmail || undefined,
      success_url: `${appUrl()}/portal?payment=success&service=${serviceId}`,
      cancel_url: `${appUrl()}/portal?payment=cancelled`,
      metadata: { serviceId, serviceName: service.name },
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pay a specific invoice by number + custom amount
app.post('/api/checkout/invoice', async (req, res) => {
  const { amount, invoiceNumber, clientEmail, description } = req.body;
  if (!amount || isNaN(parseFloat(amount))) return res.status(400).json({ error: 'Valid amount required.' });
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: description || 'Design Services — Squires Solutions',
            description: invoiceNumber ? `Invoice ${invoiceNumber}` : 'Creative & Brand Design',
          },
          unit_amount: Math.round(parseFloat(amount) * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: clientEmail || undefined,
      success_url: `${appUrl()}/portal?payment=success&inv=${invoiceNumber || ''}`,
      cancel_url: `${appUrl()}/portal?payment=cancelled`,
      metadata: { invoiceNumber: invoiceNumber || '', clientEmail: clientEmail || '' },
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// One-time: push all products to Stripe dashboard
app.post('/api/stripe/setup-products', async (req, res) => {
  try {
    const stripe = getStripe();
    const results = [];
    for (const svc of SERVICE_CATALOG) {
      const product = await stripe.products.create({
        name: svc.name,
        description: svc.description,
        metadata: { squires_id: svc.id, category: svc.category },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: svc.price,
        currency: 'usd',
        metadata: { squires_id: svc.id },
      });
      results.push({ name: svc.name, productId: product.id, priceId: price.id, amount: `$${(svc.price/100).toFixed(2)}` });
    }
    res.json({ created: results.length, products: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Portal: Contact Form ─────────────────────────────────────────────────────

app.post('/api/portal/contact', async (req, res) => {
  const { name, email, message, phone } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required.' });

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const html = `
    <div style="background:#f9f9f9;padding:32px;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#050C1A;border-radius:10px 10px 0 0;padding:20px 24px;">
        <div style="font-size:22px;font-weight:900;color:#D4A017;letter-spacing:3px;">SQUIRES SOLUTIONS</div>
        <div style="font-size:12px;color:#6888A8;margin-top:2px;">New Message from Portal</div>
      </div>
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:0 0 10px 10px;padding:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 14px 6px 0;color:#6888A8;font-weight:600;font-size:13px;white-space:nowrap;">Name</td><td style="padding:6px 0;font-size:13px;">${name}</td></tr>
          <tr><td style="padding:6px 14px 6px 0;color:#6888A8;font-weight:600;font-size:13px;">Email</td><td style="padding:6px 0;font-size:13px;"><a href="mailto:${email}">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:6px 14px 6px 0;color:#6888A8;font-weight:600;font-size:13px;">Phone</td><td style="padding:6px 0;font-size:13px;">${phone}</td></tr>` : ''}
        </table>
        <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;font-size:14px;line-height:1.7;white-space:pre-wrap;">${message}</div>
        <div style="margin-top:20px;"><a href="mailto:${email}?subject=Re: Your message to Squires Solutions" style="display:inline-block;background:#D4A017;color:#0a0a0a;font-weight:700;padding:10px 22px;border-radius:8px;text-decoration:none;font-size:13px;">Reply to ${name} →</a></div>
      </div>
    </div>`;
    await resend.emails.send({
      from: 'Squires Solutions <onboarding@resend.dev>',
      to: 'squiressolutions@gmail.com',
      subject: `Message from ${name} — Squires Solutions Portal`,
      html,
    }).catch(err => console.error('[email] contact form:', err.message));
  }
  res.json({ ok: true });
});

// ─── Portal: Client File Upload ───────────────────────────────────────────────

app.post('/api/portal/upload', (req, res) => {
  clientUpload.array('files', 5)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });

    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ error: 'No files received.' });

    // Enforce 50MB total
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    if (totalSize > MAX_TOTAL) {
      files.forEach(f => { try { unlinkSync(f.path); } catch {} });
      return res.status(400).json({ error: 'Total upload size exceeds 50 MB limit.' });
    }

    const { clientName, clientEmail, description } = req.body;

    // Email notification
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const fileRows = files.map(f =>
        `<tr><td style="padding:4px 12px 4px 0;font-size:13px;">${f.originalname}</td><td style="padding:4px 0;font-size:13px;color:#6888A8;">${(f.size/1024/1024).toFixed(2)} MB</td></tr>`
      ).join('');
      const html = `
      <div style="background:#f9f9f9;padding:32px;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#050C1A;border-radius:10px 10px 0 0;padding:20px 24px;">
          <div style="font-size:22px;font-weight:900;color:#D4A017;letter-spacing:3px;">SQUIRES SOLUTIONS</div>
          <div style="font-size:12px;color:#6888A8;margin-top:2px;">📎 New Client File Upload</div>
        </div>
        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:0 0 10px 10px;padding:24px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr><td style="padding:6px 14px 6px 0;color:#6888A8;font-weight:600;font-size:13px;">Client</td><td style="padding:6px 0;font-size:13px;">${clientName || '—'}</td></tr>
            <tr><td style="padding:6px 14px 6px 0;color:#6888A8;font-weight:600;font-size:13px;">Email</td><td style="padding:6px 0;font-size:13px;">${clientEmail || '—'}</td></tr>
            <tr><td style="padding:6px 14px 6px 0;color:#6888A8;font-weight:600;font-size:13px;vertical-align:top;">Description</td><td style="padding:6px 0;font-size:13px;">${description || '—'}</td></tr>
          </table>
          <div style="font-weight:700;font-size:12px;color:#6888A8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Files Uploaded</div>
          <table style="width:100%;border-collapse:collapse;">${fileRows}</table>
          <div style="margin-top:16px;padding:12px;background:#fff8e1;border-radius:6px;font-size:12px;color:#888;">
            Files are stored on the server temporarily. Download them promptly as they may be cleared on server redeploy.
          </div>
          <div style="margin-top:20px;"><a href="${SITE_URL}/client-requests" style="display:inline-block;background:#D4A017;color:#0a0a0a;font-weight:700;padding:10px 22px;border-radius:8px;text-decoration:none;font-size:13px;">View Admin Portal →</a></div>
        </div>
      </div>`;
      await resend.emails.send({
        from: 'Squires Solutions <onboarding@resend.dev>',
        to: 'squiressolutions@gmail.com',
        subject: `📎 New File Upload from ${clientName || 'Client'} — Squires Solutions`,
        html,
      }).catch(err => console.error('[email] upload notification:', err.message));
    }

    // Persist metadata so admin can view uploads
    const meta = {
      id: 'upl_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
      clientName:  clientName  || '',
      clientEmail: clientEmail || '',
      description: description || '',
      uploadedAt:  new Date().toISOString(),
      files: files.map(f => ({
        originalName: f.originalname,
        filename:     f.filename,
        size:         f.size,
        mimetype:     f.mimetype,
        url:          `/api/portal/upload-file/${f.filename}`,
      })),
    };
    uploadsMeta.unshift(meta);
    saveUploadsMeta(uploadsMeta);

    res.json({ ok: true, files: files.map(f => ({ name: f.originalname, size: f.size, stored: f.filename })) });
  });
});

// Admin: list all client uploads
app.get('/api/portal/uploads', (_req, res) => {
  res.json(uploadsMeta);
});

// Download a client-uploaded file
app.get('/api/portal/upload-file/:filename', (req, res) => {
  const fp = join(UPLOADS_DIR, req.params.filename);
  if (!existsSync(fp)) return res.status(404).json({ error: 'File not found.' });
  res.download(fp);
});

// ─── Portal: File Deliveries ──────────────────────────────────────────────────

// Serve uploaded/delivered files statically
// TODO: Replace with presigned S3/Supabase URLs when persistent storage is configured

// GET all deliveries — scoped by refNum if provided
// TODO: Scope by authenticated client session/token when auth is implemented
app.get('/api/portal/deliveries', (req, res) => {
  const { refNum } = req.query;
  if (refNum) {
    const sub = submissions.find(s => s.refNum === refNum);
    if (!sub) return res.json({ found: false, files: [] });
    const files = deliveries.filter(d => d.submissionId === sub.id || d.refNum === refNum);
    return res.json({ found: true, status: sub.status, client: sub.name, files });
  }
  res.json({ found: false, files: [] });
});

// Admin: deliver a file to a client submission
app.post('/api/portal/deliver', (req, res) => {
  deliveryUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file provided.' });

    const { submissionId, notes } = req.body;
    const sub = submissions.find(s => s.id === submissionId);

    const delivery = {
      id: 'del_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      submissionId: submissionId || '',
      refNum: sub?.refNum || '',
      clientName: sub?.name || '',
      clientEmail: sub?.email || '',
      notes: notes || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      url: `/api/portal/file/${req.file.filename}`,
    };

    deliveries.push(delivery);
    saveDeliveries(deliveries);

    // Notify client if email available
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && delivery.clientEmail) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'Squires Solutions <onboarding@resend.dev>',
        to: delivery.clientEmail,
        subject: `Your files are ready — Squires Solutions`,
        html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:24px;">
          <div style="font-size:22px;font-weight:900;color:#D4A017;margin-bottom:8px;">SQUIRES SOLUTIONS</div>
          <p>Hi ${delivery.clientName || 'there'},</p>
          <p>Your deliverable files are ready! A new file has been uploaded to your project:</p>
          <p style="background:#f5f5f5;padding:14px;border-radius:8px;font-weight:600;">${delivery.originalName}</p>
          ${notes ? `<p style="color:#555;">${notes}</p>` : ''}
          <p>Visit the portal to view and download your files:</p>
          <a href="${SITE_URL}/portal" style="display:inline-block;background:#D4A017;color:#0a0a0a;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">View Files →</a>
          <p style="font-size:12px;color:#999;margin-top:24px;">Squires Solutions · squiressolutions@gmail.com</p>
        </div>`,
      }).catch(() => {});
    }

    res.json(delivery);
  });
});

// Download a delivered file
app.get('/api/portal/file/:filename', (req, res) => {
  const fp = join(DELIVERIES_DIR, req.params.filename);
  if (!existsSync(fp)) return res.status(404).json({ error: 'File not found.' });
  res.download(fp);
});

// ─── Static / SPA ─────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildPath = join(__dirname, 'dist');

if (existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (_req, res) => {
    res.sendFile(join(buildPath, 'index.html'));
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
