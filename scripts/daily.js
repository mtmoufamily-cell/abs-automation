/**
 * AB's Studio — Daily Automation
 * Runs every day at 19h NC time (08:00 UTC)
 * Generates 1 video per category + weekly Gumroad product
 */

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GUMROAD_KEY = process.env.GUMROAD_ACCESS_TOKEN;
const EMAIL = 'mtmoufamily@gmail.com';

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
const KIDS_NICHES = [
  { id: 'facts',      emoji: '🦁', label: 'Fun Facts animaux',     lang: 'fr' },
  { id: 'song',       emoji: '🎵', label: 'Chansons éducatives',   lang: 'fr' },
  { id: 'emotions',   emoji: '😊', label: 'Émotions enfants',      lang: 'fr' },
  { id: 'motivation', emoji: '💪', label: 'Motivation & Citations', lang: 'fr' },
  { id: 'astuces',    emoji: '🔧', label: 'Astuces de la vie',     lang: 'fr' },
  { id: 'humour',     emoji: '😂', label: 'Humour Outre-Mer',      lang: 'fr' },
];

const PRO_NICHES = [
  { id: 'electricite', emoji: '⚡', label: 'Electrical Tips',   lang: 'en' },
  { id: 'bricolage',   emoji: '🔨', label: 'Home Improvement',  lang: 'en' },
  { id: 'plomberie',   emoji: '🚿', label: 'Plumbing Tips',     lang: 'en' },
  { id: 'mecanique',   emoji: '🚗', label: 'Car Maintenance',   lang: 'en' },
  { id: 'jardinage',   emoji: '🌿', label: 'Garden & Outdoor',  lang: 'en' },
];

// ─── PROMPTS ─────────────────────────────────────────────────────────────────
function getPrompt(niche) {
  const topics = {
    facts:       "un fait surprenant sur un animal (insectes, mammifères marins, reptiles, oiseaux)",
    song:        "une chanson éducative avec gestes à imiter pour enfants 3-8 ans",
    emotions:    "une émotion enfant (joie, tristesse, colère, peur, surprise, fierté)",
    motivation:  "une citation inspirante du jour avec contexte et application concrète",
    astuces:     "une astuce pratique du quotidien (électricité, plomberie, mécanique, bricolage)",
    humour:      "un sketch humoristique Outre-Mer (Nouvelle-Calédonie, Tahiti, Martinique, Guadeloupe, Réunion)",
    electricite: "a practical home electrical safety tip or repair trick",
    bricolage:   "a practical home improvement or renovation tip",
    plomberie:   "a practical plumbing tip for homeowners",
    mecanique:   "a car maintenance or auto repair tip",
    jardinage:   "a gardening or outdoor maintenance tip",
  };

  const isEN = niche.lang === 'en';
  const channelName = isEN ? "AB's Pro" : "AB's Kids";
  const topic = topics[niche.id];

  if (isEN) {
    return `You are an expert YouTube Shorts creator for homeowners and DIY enthusiasts. Channel: "${channelName}".
Create an original Short about: ${topic}.
Reply ONLY in valid JSON without markdown:
{"titre":"YouTube title EN max 60 chars with emoji #Shorts","hook":"0-3 sec hook to stop the scroll","concept":"2-3 sentences: exact tip, materials, result in 45-60 sec","script_en":"full spoken script EN 60-80 words natural","cta":"CTA to save and share","desc":"YouTube description EN 120 words invite to subscribe","hashtags_yt":"#ABsPro #DIY #Shorts [6 relevant hashtags]","caption_tt":"TikTok EN caption 3 lines","hashtags_tt":"#DIY #HomeImprovement #Shorts [5 hashtags]","caption_ig":"Instagram EN caption with emojis","hashtags_ig":"#DIY #HomeRepair #Shorts [6 hashtags]"}`;
  } else {
    return `Tu es expert YouTube Shorts. Chaîne : "${channelName}".
Crée un Short original sur : ${topic}.
Réponds UNIQUEMENT en JSON valide sans markdown :
{"titre":"titre YouTube FR max 60 chars avec emoji #Shorts","hook":"accroche 0-3 sec pour arrêter le scroll","concept":"2-3 phrases : sujet précis, valeur, comment montrer en 45 sec","cta":"call to action final engageant","desc":"description YouTube FR 120 mots invitation à s'abonner","hashtags_yt":"#ABsKids #Shorts [6 hashtags FR pertinents]","caption_tt":"caption TikTok FR 3 lignes","hashtags_tt":"#Shorts #YouTubeKids [5 hashtags FR]","caption_ig":"caption Instagram FR avec emojis","hashtags_ig":"#Enfants #Shorts [6 hashtags FR]"}`;
  }
}

// ─── API CALLS ────────────────────────────────────────────────────────────────
async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt + '\n\nIMPORTANT: Reply with ONLY raw JSON. Start with { end with }.' }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  let text = data.content?.find(b => b.type === 'text')?.text || '';
  text = text.replace(/```json|```/g, '').trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1) text = text.substring(first, last + 1);
  return JSON.parse(text);
}

// ─── GUMROAD ──────────────────────────────────────────────────────────────────
async function createGumroadProduct(product) {
  if (!GUMROAD_KEY) { console.log('No Gumroad key — skipping'); return null; }
  try {
    const body = new URLSearchParams();
    body.append('access_token', GUMROAD_KEY);
    body.append('name', product.name);
    body.append('description', product.description);
    body.append('price', product.price_cents);
    body.append('currency', 'usd');
    body.append('published', 'false'); // draft — tu publies manuellement

    const res = await fetch('https://api.gumroad.com/v2/products', {
      method: 'POST',
      body,
    });
    const data = await res.json();
    if (data.success) {
      console.log(`✅ Gumroad product created: ${data.product.name} — ${data.product.short_url}`);
      return data.product;
    } else {
      console.log('Gumroad error:', data.message);
      return null;
    }
  } catch (e) {
    console.log('Gumroad exception:', e.message);
    return null;
  }
}

async function generateGumroadProduct() {
  const prompt = `Tu es expert en produits digitaux qui se vendent sur Gumroad. Crée un produit digital rentable pour un électricien/bricoleur expert en Nouvelle-Calédonie.
Catégories qui marchent : guides PDF pratiques, templates Excel/Google Sheets, packs de prompts IA pour artisans, checklists professionnelles.
Prix idéal : $15-35 USD.
Réponds UNIQUEMENT en JSON valide sans markdown :
{"name":"nom du produit en anglais (plus de ventes EN)","description":"description Gumroad 200 mots EN qui convertit — problème, solution, ce qu'ils reçoivent, pour qui","price_cents":2500,"content_outline":"liste de 5-8 éléments inclus dans le produit","marketing_hook":"phrase d'accroche pour les réseaux sociaux","target_audience":"qui achète ce produit exactement"}`;

  const product = await callClaude(prompt);
  console.log('\n🛍️ PRODUIT GUMROAD GÉNÉRÉ:');
  console.log(`📦 ${product.name}`);
  console.log(`💰 $${product.price_cents / 100}`);
  console.log(`🎯 ${product.target_audience}`);
  console.log(`📝 ${product.content_outline}`);
  return product;
}

// ─── EMAIL RECAP ──────────────────────────────────────────────────────────────
function buildEmailReport(date, videos, gumroadProduct) {
  let html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#0A0A0F;color:#F8F7FF;margin:0;padding:20px;}
.header{background:linear-gradient(135deg,#7C3AED,#FDE047);padding:20px;border-radius:12px;margin-bottom:20px;text-align:center;}
.header h1{margin:0;font-size:24px;color:#000;}
.card{background:#16161F;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;margin-bottom:12px;}
.card h3{margin:0 0 8px;color:#FDE047;}
.label{font-size:11px;text-transform:uppercase;color:#6B7280;margin-bottom:4px;}
.val{font-size:13px;color:#F8F7FF;background:#1A1A26;padding:8px;border-radius:6px;margin-bottom:8px;}
.gumroad{background:#1A2A1A;border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:16px;margin-bottom:12px;}
.gumroad h3{color:#22C55E;margin:0 0 8px;}
.btn{display:inline-block;background:#FF0000;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:700;margin:4px;}
.btn-tt{background:#010101;border:1px solid #333;}
.btn-ig{background:linear-gradient(135deg,#F58529,#DD2A7B);}
.btn-gm{background:#22C55E;color:#000;}
.footer{text-align:center;font-size:11px;color:#6B7280;margin-top:20px;}
</style></head>
<body>
<div class="header">
  <h1>⭐ AB's Studio — Récap du ${date}</h1>
  <p style="margin:4px 0;font-size:14px;">${videos.length} vidéos générées · 1 produit Gumroad</p>
</div>`;

  videos.forEach(v => {
    html += `
<div class="card">
  <h3>${v.niche.emoji} ${v.niche.label}</h3>
  <div class="label">📝 Titre</div>
  <div class="val">${v.content.titre || v.content.title_en || ''}</div>
  <div class="label">🎣 Hook</div>
  <div class="val">${v.content.hook || ''}</div>
  <div class="label">🎬 Script</div>
  <div class="val">${v.content.script_en || v.content.concept || ''}</div>
  <div class="label">📄 Description YouTube</div>
  <div class="val">${v.content.desc || ''}</div>
  <div class="label">Hashtags YouTube</div>
  <div class="val">${v.content.hashtags_yt || ''}</div>
  <div class="label">💬 Caption TikTok</div>
  <div class="val">${v.content.caption_tt || ''} ${v.content.hashtags_tt || ''}</div>
  <div class="label">📸 Caption Instagram</div>
  <div class="val">${v.content.caption_ig || ''} ${v.content.hashtags_ig || ''}</div>
  <div style="margin-top:10px;">
    <a href="https://app.heygen.com/create" class="btn">🎬 HeyGen</a>
    <a href="https://studio.youtube.com" class="btn">▶️ YouTube</a>
    <a href="https://www.tiktok.com/upload" class="btn btn-tt">🎵 TikTok</a>
    <a href="https://www.instagram.com/reels/upload" class="btn btn-ig">📸 Instagram</a>
  </div>
</div>`;
  });

  if (gumroadProduct) {
    html += `
<div class="gumroad">
  <h3>🛍️ Produit Gumroad de la semaine</h3>
  <div class="label">📦 Nom</div>
  <div class="val">${gumroadProduct.name}</div>
  <div class="label">💰 Prix</div>
  <div class="val">$${gumroadProduct.price_cents / 100} USD</div>
  <div class="label">🎯 Audience cible</div>
  <div class="val">${gumroadProduct.target_audience}</div>
  <div class="label">📝 Contenu inclus</div>
  <div class="val">${Array.isArray(gumroadProduct.content_outline) ? gumroadProduct.content_outline.join(', ') : gumroadProduct.content_outline}</div>
  <div class="label">📣 Hook marketing</div>
  <div class="val">${gumroadProduct.marketing_hook}</div>
  <div class="label">📄 Description Gumroad</div>
  <div class="val">${gumroadProduct.description}</div>
  <div style="margin-top:10px;">
    <a href="https://app.gumroad.com/products" class="btn btn-gm">✅ Publier sur Gumroad</a>
  </div>
</div>`;
  }

  html += `
<div class="footer">
  AB's Studio Automation · GitHub Actions · ${date}<br>
  Généré automatiquement par Claude Sonnet
</div>
</body></html>`;

  return html;
}

// ─── SEND EMAIL VIA RESEND ────────────────────────────────────────────────────
async function sendEmail(subject, html) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    console.log('No Resend key — email skipped');
    console.log('Subject:', subject);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: 'AB\'s Studio <onboarding@resend.dev>',
      to: [EMAIL],
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (data.id) console.log(`✅ Email sent to ${EMAIL}`);
  else console.log('Email error:', JSON.stringify(data));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dayOfWeek = new Date().getDay(); // 0=dimanche, 1=lundi...
  const isMonday = dayOfWeek === 1;

  console.log(`\n🚀 AB's Studio Automation — ${date}`);
  console.log('─'.repeat(50));

  const allNiches = [...KIDS_NICHES, ...PRO_NICHES];
  const videos = [];

  // Generate 1 video per niche
  for (const niche of allNiches) {
    try {
      console.log(`\n⏳ Generating ${niche.emoji} ${niche.label}...`);
      const content = await callClaude(getPrompt(niche));
      videos.push({ niche, content });
      console.log(`✅ ${content.titre || content.title_en || 'Done'}`);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.log(`❌ Error for ${niche.label}:`, e.message);
    }
  }

  // Generate Gumroad product every Monday
  let gumroadProduct = null;
  let gumroadCreated = null;
  if (isMonday) {
    console.log('\n🛍️ Monday — generating Gumroad product...');
    try {
      gumroadProduct = await generateGumroadProduct();
      gumroadCreated = await createGumroadProduct(gumroadProduct);
    } catch (e) {
      console.log('Gumroad error:', e.message);
    }
  }

  // Save results to JSON
  const results = {
    date,
    generated_at: new Date().toISOString(),
    videos: videos.map(v => ({ niche: v.niche, content: v.content })),
    gumroad_product: gumroadProduct,
  };

  const fs = await import('fs');
  fs.writeFileSync('./products/latest.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to products/latest.json');

  // Send email recap
  console.log('\n📧 Sending email recap...');
  const html = buildEmailReport(date, videos, gumroadProduct);
  await sendEmail(`⭐ AB's Studio — ${videos.length} vidéos générées — ${date}`, html);

  console.log('\n✅ Automation complete!');
  console.log(`📊 ${videos.length} videos generated`);
  if (gumroadProduct) console.log(`🛍️ 1 Gumroad product created`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
