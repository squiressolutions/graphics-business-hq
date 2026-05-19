import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

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
const DATA_DIR = join(__dirnameEarly, 'data');
const SUBMISSIONS_FILE = join(DATA_DIR, 'submissions.json');

function loadSubmissions() {
  try { return JSON.parse(readFileSync(SUBMISSIONS_FILE, 'utf8')); } catch { return []; }
}
function saveSubmissions(data) {
  try { mkdirSync(DATA_DIR, { recursive: true }); writeFileSync(SUBMISSIONS_FILE, JSON.stringify(data, null, 2)); } catch {}
}

let submissions = loadSubmissions();

function makeRefNum() {
  return 'REQ-' + String(Date.now()).slice(-6) + Math.random().toString(36).slice(2, 5).toUpperCase();
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
    name, business, email, phone, website } = req.body;

  const entry = {
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    refNum: makeRefNum(),
    status: 'new',
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
  };

  submissions.unshift(entry);
  saveSubmissions(submissions);
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
