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
  const isPro = niche.lang === 'en';
  const chName = isPro ? "AB's Pro" : "AB's Kids";

  if (isPro) {
    const topics = {
      electricite: 'a practical home electrical safety tip or repair trick',
      bricolage:   'a practical home improvement or renovation tip',
      plomberie:   'a practical plumbing tip for homeowners',
      mecanique:   'a car maintenance or auto repair tip',
      jardinage:   'a gardening or outdoor maintenance tip',
    };
    const topic = topics[niche.id] || topics.bricolage;
    return `You are an expert YouTube Shorts creator for homeowners and DIY enthusiasts. Channel: "${chName}".
Create an original Short about: ${topic}.

The script MUST be COMPLETE and RICH — not just a basic tip. Required structure:
1. A SURPRISING HOOK — a problem everyone has faced or a counter-intuitive fact
2. THE EXACT TECHNIQUE — step by step, tools needed, how to do it properly
3. WHY IT MATTERS — cost savings, safety, what happens if you don't do it
4. A PRO SECRET — something only professionals know
5. A CLEAR RESULT — what the viewer can achieve after watching

Reply ONLY with valid JSON without markdown:
{"titre":"YouTube title EN max 60 chars with tool emoji #Shorts","hook":"0-3 sec hook that stops the scroll — real problem everyone has faced","script":"COMPLETE spoken script EN — 80 to 100 words — natural, rhythmic, with all 5 structure elements — conversational and engaging","concept":"2-3 sentences summarizing what viewers learn","cta":"final CTA to save and share","desc":"YouTube description EN 150-200 words with hook, full content summary, what they learn, subscribe invite to ${chName}","hashtags_yt":"#ABsPro #DIY #HomeImprovement #Shorts #HowTo [5 more relevant EN hashtags]","caption_tt":"TikTok EN caption 2-3 punchy lines with emojis","hashtags_tt":"#DIY #HomeImprovement #Shorts #LifeHack #HowTo [4 more hashtags]","caption_ig":"Instagram EN caption 3-4 lines with emojis — save this tip!","hashtags_ig":"#DIY #HomeRepair #Shorts #HomeImprovement #LifeHack [5 more hashtags]","subtitles_fr":[{"time":"0:00-0:05","text":"Traduction FR des 5 premières secondes"},{"time":"0:05-0:20","text":"Traduction FR 5-20 sec"},{"time":"0:20-0:40","text":"Traduction FR 20-40 sec"},{"time":"0:40-0:60","text":"Traduction FR 40-60 sec"}],"angle_viral":"why this tip will be massively saved and shared"}`;
  } else {
    const topics = {
      facts:       "un fait surprenant sur un animal différent (insectes, mammifères marins, reptiles, oiseaux, araignées...)",
      song:        "une chanson éducative avec gestes à imiter pour enfants 3-8 ans",
      emotions:    "une émotion enfant différente (joie, tristesse, colère, peur, surprise, fierté, jalousie...)",
      motivation:  "une citation inspirante avec contexte, histoire et application concrète pour les enfants",
      astuces:     "une astuce pratique du quotidien (électricité, plomberie, mécanique, bricolage, cuisine...)",
      humour:      "un sketch humoristique Outre-Mer (Nouvelle-Calédonie, Tahiti, Martinique, Guadeloupe, Réunion) — situations du quotidien insulaire",
    };
    const topic = topics[niche.id] || topics.facts;
    return `Tu es expert YouTube Shorts pour enfants 3-8 ans et leurs parents. Chaîne : "${chName}".
Crée un Short original sur : ${topic}.

Le script DOIT être COMPLET et RICHE — pas juste un fait basique. Structure obligatoire :
1. UN FAIT SURPRENANT qui accroche immédiatement
2. COMMENT ça fonctionne exactement (mécanisme, biologie, comportement détaillé)
3. POURQUOI c'est important pour nous / impact sur la vie réelle (maladies, écosystème, danger, utilité, protection...)
4. UN DÉTAIL INCROYABLE que personne ne connaît
5. UN ENSEIGNEMENT ou MESSAGE clair pour les enfants

Exemple pour les moustiques : pas juste "ils piquent pour se nourrir" — expliquer AUSSI qu'ils transmettent des maladies graves comme le paludisme et la dengue, que seules les femelles piquent, qu'ils pollinisent des fleurs, et comment se protéger.

Réponds UNIQUEMENT en JSON valide sans markdown :
{"titre":"titre YouTube FR max 60 chars avec emoji accrocheur #Shorts","hook":"phrase choc 0-3 sec — une vérité surprenante ou contre-intuitive qui arrête le scroll","script":"script COMPLET à lire à voix haute — 80 à 100 mots — naturel, rythmé, avec les 5 éléments de structure — adapté aux enfants ET intéressant pour les parents","concept":"résumé en 2-3 phrases de ce qu'on apprend dans cette vidéo","cta":"call to action final fun et engageant qui invite à commenter ou taguer un ami","desc":"description YouTube FR 150-200 mots avec hook accrocheur, résumé complet du contenu éducatif, ce qu'on apprend, invitation à s'abonner à ${chName}","hashtags_yt":"#ABsKids #Shorts #Education #Enfants #FunFacts [5 hashtags FR pertinents]","caption_tt":"caption TikTok FR 2-3 lignes percutantes avec emojis — commence par le fait le plus surprenant","hashtags_tt":"#ApprendreEnSAmusant #Enfants #Shorts #Education #FunFacts [4 hashtags FR]","caption_ig":"caption Instagram FR 3-4 lignes avec emojis — invite les parents à partager","hashtags_ig":"#Education #Enfants #Shorts #FunFacts #ABsKids [5 hashtags FR]","angle_viral":"pourquoi cette vidéo va être sauvegardée et partagée par les parents"}`;
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
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt + '\n\nIMPORTANT: Reply with ONLY raw JSON. No markdown. Start with { end with }.' }],
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
    body.append('published', 'false');
    const res = await fetch('https://api.gumroad.com/v2/products', { method: 'POST', body });
    const data = await res.json();
    if (data.success) {
      console.log(`✅ Gumroad: ${data.product.name} — ${data.product.short_url}`);
      return data.product;
    }
    console.log('Gumroad error:', data.message);
    return null;
  } catch (e) {
    console.log('Gumroad exception:', e.message);
    return null;
  }
}

async function generateGumroadProduct() {
  const prompt = `Tu es expert en produits digitaux qui se vendent sur Gumroad. Crée un produit digital rentable lié au bricolage, à l'électricité, à la maintenance maison ou aux astuces pratiques pour propriétaires.
Catégories qui marchent : guides PDF pratiques, templates Excel/Google Sheets, packs de prompts IA pour artisans, checklists professionnelles.
Prix idéal : $15-35 USD. Le produit doit être facile à créer (PDF ou template) et résoudre un vrai problème.
Réponds UNIQUEMENT en JSON valide sans markdown :
{"name":"nom du produit en anglais","description":"description Gumroad 200 mots EN qui convertit — problème, solution, ce qu'ils reçoivent, pour qui","price_cents":2500,"content_outline":"liste de 5-8 éléments inclus dans le produit","marketing_hook":"phrase d'accroche pour les réseaux sociaux","target_audience":"qui achète ce produit exactement"}`;
  const product = await callClaude(prompt);
  console.log(`\n🛍️ Produit Gumroad : ${product.name} — $${product.price_cents / 100}`);
  return product;
}

// ─── EMAIL RECAP ──────────────────────────────────────────────────────────────
function buildEmailReport(date, videos, gumroadProduct) {
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#0A0A0F;color:#F8F7FF;margin:0;padding:20px;}
.header{background:linear-gradient(135deg,#7C3AED,#FDE047);padding:20px;border-radius:12px;margin-bottom:20px;text-align:center;}
.header h1{margin:0;font-size:22px;color:#000;}
.card{background:#16161F;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;margin-bottom:12px;}
.card h3{margin:0 0 10px;color:#FDE047;font-size:15px;}
.label{font-size:10px;text-transform:uppercase;color:#6B7280;margin-bottom:3px;margin-top:10px;font-weight:600;letter-spacing:0.05em;}
.val{font-size:13px;color:#F8F7FF;background:#1A1A26;padding:9px 12px;border-radius:6px;line-height:1.6;white-space:pre-wrap;}
.script-box{font-size:14px;color:#E8C96A;background:#1A1A26;border:1px solid rgba(253,224,71,0.2);padding:12px;border-radius:8px;line-height:1.8;white-space:pre-wrap;}
.gumroad{background:#1A2A1A;border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:16px;margin-bottom:12px;}
.gumroad h3{color:#22C55E;margin:0 0 10px;}
.btn{display:inline-block;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:700;margin:4px;font-size:12px;}
.btn-yt{background:#FF0000;}
.btn-tt{background:#010101;border:1px solid #333;}
.btn-ig{background:linear-gradient(135deg,#F58529,#DD2A7B);}
.btn-hg{background:#4A4A8A;}
.btn-gm{background:#22C55E;color:#000;}
.footer{text-align:center;font-size:11px;color:#6B7280;margin-top:20px;}
.divider{height:1px;background:rgba(255,255,255,0.06);margin:10px 0;}
</style></head><body>
<div class="header">
  <h1>⭐ AB's Studio — ${date}</h1>
  <p style="margin:4px 0;font-size:13px;color:#000;">${videos.length} vidéos générées${gumroadProduct ? ' · 1 produit Gumroad' : ''}</p>
</div>`;

  videos.forEach(v => {
    const isPro = v.niche.lang === 'en';
    html += `<div class="card">
  <h3>${v.niche.emoji} ${v.niche.label}${isPro ? ' <span style="font-size:11px;color:#14B8A6;background:rgba(20,184,166,0.1);padding:2px 8px;border-radius:8px;">EN + ST FR</span>' : ''}</h3>
  <div class="label">📝 Titre</div>
  <div class="val">${v.content.titre || v.content.title_en || ''}</div>
  <div class="label">🎣 Hook (0-3 sec)</div>
  <div class="val">${v.content.hook || ''}</div>
  <div class="divider"></div>
  <div class="label">🎬 Script complet ${isPro ? '(EN)' : '(FR)'} — à coller dans HeyGen</div>
  <div class="script-box">${v.content.script || v.content.script_en || ''}</div>
  ${isPro && v.content.subtitles_fr ? `
  <div class="label">📝 Sous-titres FR</div>
  <div class="val">${v.content.subtitles_fr.map(s => '[' + s.time + '] ' + s.text).join('\n')}</div>` : ''}
  <div class="divider"></div>
  <div class="label">📄 Description YouTube</div>
  <div class="val">${v.content.desc || ''}</div>
  <div class="label">#️⃣ Hashtags YouTube</div>
  <div class="val">${v.content.hashtags_yt || ''}</div>
  <div class="label">💬 Caption TikTok + Hashtags</div>
  <div class="val">${(v.content.caption_tt || '') + '\n' + (v.content.hashtags_tt || '')}</div>
  <div class="label">📸 Caption Instagram + Hashtags</div>
  <div class="val">${(v.content.caption_ig || '') + '\n' + (v.content.hashtags_ig || '')}</div>
  <div style="margin-top:12px;">
    <a href="https://app.heygen.com/create" class="btn btn-hg">🎬 HeyGen</a>
    <a href="https://studio.youtube.com" class="btn btn-yt">▶️ YouTube</a>
    <a href="https://www.tiktok.com/upload" class="btn btn-tt">🎵 TikTok</a>
    <a href="https://www.instagram.com/reels/upload" class="btn btn-ig">📸 Instagram</a>
  </div>
</div>`;
  });

  if (gumroadProduct) {
    html += `<div class="gumroad">
  <h3>🛍️ Produit Gumroad de la semaine</h3>
  <div class="label">📦 Nom</div><div class="val">${gumroadProduct.name}</div>
  <div class="label">💰 Prix</div><div class="val">$${gumroadProduct.price_cents / 100} USD</div>
  <div class="label">🎯 Audience</div><div class="val">${gumroadProduct.target_audience}</div>
  <div class="label">📝 Contenu</div><div class="val">${Array.isArray(gumroadProduct.content_outline) ? gumroadProduct.content_outline.join('\n') : gumroadProduct.content_outline}</div>
  <div class="label">📣 Hook marketing</div><div class="val">${gumroadProduct.marketing_hook}</div>
  <div class="label">📄 Description</div><div class="val">${gumroadProduct.description}</div>
  <div style="margin-top:10px;"><a href="https://app.gumroad.com/products" class="btn btn-gm">✅ Publier sur Gumroad</a></div>
</div>`;
  }

  html += `<div class="footer">AB's Studio Automation · GitHub Actions · ${date}</div></body></html>`;
  return html;
}

// ─── SEND EMAIL ────────────────────────────────────────────────────────────────
async function sendEmail(subject, html) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) { console.log('No Resend key — skipping email'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: "AB's Studio <onboarding@resend.dev>",
      to: [EMAIL],
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (data.id) console.log(`✅ Email envoyé à ${EMAIL}`);
  else console.log('Email error:', JSON.stringify(data));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isMonday = new Date().getDay() === 1;

  console.log(`\n🚀 AB's Studio Automation — ${date}`);
  console.log('─'.repeat(50));

  const allNiches = [...KIDS_NICHES, ...PRO_NICHES];
  const videos = [];

  for (const niche of allNiches) {
    try {
      console.log(`\n⏳ ${niche.emoji} ${niche.label}...`);
      const content = await callClaude(getPrompt(niche));
      videos.push({ niche, content });
      console.log(`✅ ${content.titre || content.title_en || 'OK'}`);
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.log(`❌ Erreur ${niche.label}:`, e.message);
    }
  }

  let gumroadProduct = null;
  if (isMonday) {
    console.log('\n🛍️ Lundi — génération produit Gumroad...');
    try {
      gumroadProduct = await generateGumroadProduct();
      await createGumroadProduct(gumroadProduct);
    } catch (e) {
      console.log('Gumroad error:', e.message);
    }
  }

  const fs = await import('fs');
  const results = { date, generated_at: new Date().toISOString(), videos: videos.map(v => ({ niche: v.niche, content: v.content })), gumroad_product: gumroadProduct };
  fs.writeFileSync('./products/latest.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Résultats sauvegardés dans products/latest.json');

  await sendEmail(`⭐ AB's Studio — ${videos.length} vidéos — ${date}`, buildEmailReport(date, videos, gumroadProduct));

  console.log(`\n✅ Terminé ! ${videos.length} vidéos générées${gumroadProduct ? ' + 1 produit Gumroad' : ''}`);
}

main().catch(e => { console.error('Erreur fatale:', e); process.exit(1); });
