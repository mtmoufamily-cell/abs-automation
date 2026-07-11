/**
 * Tropik' Studio — Daily Automation
 * Runs every day at 19h NC time (08:00 UTC)
 * Generates 1 video per category + weekly Gumroad product
 */

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GUMROAD_KEY = process.env.GUMROAD_ACCESS_TOKEN;
const EMAIL = 'mtmoufamily@gmail.com';

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

// Sujets rotatifs pour éviter les répétitions
const ROTATION = {
  facts: [
    "le moustique tigre — piqûre, maladies transmises (dengue, paludisme, zika), comment se protéger, rôle dans l'écosystème",
    "le requin baleine — le plus grand poisson du monde, régime alimentaire, migration, espèce protégée",
    "la pieuvre — 3 coeurs, 9 cerveaux, changement de couleur, intelligence remarquable",
    "la fourmi — force surhumaine, organisation de la colonie, rôle dans l'écosystème, communication chimique",
    "le caméléon — changement de couleur (pas camouflage mais communication), langue ultra-rapide, yeux indépendants",
    "la baleine bleue — plus grand animal, chant sous-marin, migration, menace d'extinction",
    "le gecko — marcher au plafond, queue qui repousse, yeux sans paupières, cri nocturne",
    "l'abeille — production de miel, pollinisation vitale, communication par danse, reine et ouvrières",
    "le dauphin — intelligence, langage, jeux, écholocation, lien avec les humains",
    "la mante religieuse — chasseuse redoutable, vision 3D, peut tourner la tête à 180°",
  ],
  song: [
    "une chanson sur les couleurs de l'arc-en-ciel avec gestes",
    "une chanson pour apprendre les chiffres de 1 à 10 en s'amusant",
    "une chanson sur les animaux de la jungle avec leurs cris",
    "une chanson pour apprendre les jours de la semaine",
    "une chanson sur les fruits tropicaux (mangue, ananas, coco...)",
    "une chanson pour apprendre à dire bonjour dans 5 langues",
  ],
  emotions: [
    "la colère — pourquoi on se met en colère, comment la gérer sans blesser les autres",
    "la peur — à quoi elle sert, comment la surmonter, exemples concrets pour enfants",
    "la jalousie — pourquoi on la ressent, comment la transformer en motivation",
    "la tristesse — que faire quand on est triste, pleurer c'est normal et utile",
    "la joie — comment la partager, les petits bonheurs du quotidien",
    "la fierté — être fier de soi sans se vanter, célébrer ses réussites",
  ],
  motivation: [
    "Nelson Mandela — persévérance malgré 27 ans de prison, message d'espoir",
    "Marie Curie — première femme prix Nobel, surmonter les obstacles, curiosité",
    "Malala — courage face à l'adversité, importance de l'éducation",
    "Einstein — mauvais élève devenu génie, l'échec comme étape vers le succès",
    "Simone Veil — force de caractère, se battre pour ses convictions",
  ],
  astuces: [
    "comment tester une prise électrique en toute sécurité avec un testeur de tension",
    "comment déboucher un évier sans produits chimiques — méthode bicarbonate et vinaigre",
    "comment économiser l'électricité à la maison — 5 astuces pratiques",
    "comment réparer une fuite robinet — changer un joint facilement",
    "comment entretenir sa voiture — niveaux à vérifier chaque mois",
  ],
  humour: [
    "quand tu expliques à un métro qu'il fait pas chaud à 28°C en Calédonie",
    "les 5 types de voisins qu'on trouve forcément en Outre-Mer",
    "la différence entre faire la queue en métropole et en Calédonie",
    "quand ta famille de métropole débarque et découvre la vie aux îles",
    "les expressions créoles/kanak que les métros comprennent pas du tout",
    "le rapport des îliens avec la pluie tropicale vs les métros sous la pluie",
  ],
};

const PRO_ROTATION = {
  electricite: [
    "how to safely reset a tripped circuit breaker — causes, steps, when to call a pro",
    "how to test an electrical outlet with a voltage tester — step by step for homeowners",
    "why your lights flicker — 5 causes and how to fix each one",
    "how to install a dimmer switch — tools needed, wiring, safety tips",
    "how to find a short circuit in your home — systematic diagnosis method",
  ],
  bricolage: [
    "how to patch a hole in drywall — materials, technique, painting over it",
    "how to fix a squeaky floor — finding the loose board, securing it permanently",
    "how to caulk a bathtub perfectly — prep, application, smoothing, drying time",
    "how to hang heavy items on walls — finding studs, anchors for different wall types",
    "how to fix a door that won't close — diagnosing hinge, strike plate, frame issues",
  ],
  plomberie: [
    "how to unclog a drain without chemicals — plunger technique, drain snake, hot water",
    "how to fix a running toilet — diagnosing flapper, fill valve, overflow tube",
    "how to shut off water in an emergency — main valve, fixture valves, what to do next",
    "how to replace a showerhead — tools, removing old one, teflon tape trick",
    "how to fix low water pressure — causes, aerator cleaning, pressure regulator check",
  ],
  mecanique: [
    "how to check and top up your engine oil — frequency, correct level, type of oil",
    "how to jump start a car safely — cable order, which terminal first, why it matters",
    "how to check tire pressure — correct PSI, when to check, underinflation risks",
    "how to replace windshield wiper blades — choosing size, installation in 2 minutes",
    "how to check brake pads without removing wheels — visual inspection technique",
  ],
  jardinage: [
    "how to water plants correctly — morning vs evening, deep watering vs surface, signs of overwatering",
    "how to make compost at home — what to add, what to avoid, timeline, how to use it",
    "how to get rid of garden pests naturally — companion planting, neem oil, physical barriers",
    "how to prune fruit trees for maximum yield — timing, angle of cut, which branches to remove",
    "how to grow herbs indoors year-round — light requirements, watering, harvesting correctly",
  ],
};

function getTopicForNiche(nicheId, lang) {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  
  if (lang === 'fr') {
    const topics = ROTATION[nicheId];
    if (topics) return topics[dayOfYear % topics.length];
  } else {
    const topics = PRO_ROTATION[nicheId];
    if (topics) return topics[dayOfYear % topics.length];
  }
  return null;
}

function getPrompt(niche) {
  const isPro = niche.lang === 'en';
  const chName = isPro ? "Tropik' Pro" : "Tropik' Kids";
  const topic = getTopicForNiche(niche.id, niche.lang);

  if (isPro) {
    return `You are an expert YouTube Shorts creator for homeowners and DIY enthusiasts. Channel: "${chName}".
Create an original Short about: ${topic}.

The script MUST be COMPLETE and RICH. Required structure:
1. A SURPRISING HOOK — a problem everyone has faced
2. THE EXACT TECHNIQUE — step by step, tools needed
3. WHY IT MATTERS — cost savings, safety risks
4. A PRO SECRET — something only professionals know
5. A CLEAR RESULT — what the viewer achieves

Reply ONLY with valid JSON without markdown:
{"titre":"YouTube title EN max 60 chars with tool emoji #Shorts","hook":"0-3 sec hook — real problem everyone has faced","script":"COMPLETE spoken script EN 80-100 words — natural, rhythmic, all 5 structure elements","concept":"2-3 sentences summarizing what viewers learn","cta":"final CTA to save and share","desc":"YouTube description EN 150-200 words with hook, full content summary, subscribe invite to ${chName}","hashtags_yt":"#TropikPro #DIY #HomeImprovement #Shorts #HowTo [5 more relevant EN hashtags]","caption_tt":"TikTok EN caption 2-3 punchy lines with emojis","hashtags_tt":"#DIY #HomeImprovement #Shorts #LifeHack #HowTo [4 more hashtags]","caption_ig":"Instagram EN caption 3-4 lines with emojis","hashtags_ig":"#DIY #HomeRepair #Shorts #HomeImprovement #LifeHack [5 more hashtags]","subtitles_fr":[{"time":"0:00-0:05","text":"Traduction FR des 5 premières secondes"},{"time":"0:05-0:20","text":"Traduction FR 5-20 sec"},{"time":"0:20-0:40","text":"Traduction FR 20-40 sec"},{"time":"0:40-0:60","text":"Traduction FR 40-60 sec"}],"angle_viral":"why this tip will be massively saved and shared"}`;
  } else {
    return `Tu es expert YouTube Shorts pour enfants 3-8 ans et leurs parents. Chaîne : "${chName}".
Crée un Short original sur : ${topic}.

Le script DOIT être COMPLET et RICHE. Structure obligatoire :
1. UN FAIT SURPRENANT qui accroche immédiatement
2. COMMENT ça fonctionne exactement (mécanisme, biologie, comportement détaillé)
3. POURQUOI c'est important pour nous (maladies, écosystème, danger, utilité, protection...)
4. UN DÉTAIL INCROYABLE que personne ne connaît
5. UN ENSEIGNEMENT clair pour les enfants

Réponds UNIQUEMENT en JSON valide sans markdown :
{"titre":"titre YouTube FR max 60 chars avec emoji accrocheur #Shorts","hook":"phrase choc 0-3 sec — une vérité surprenante qui arrête le scroll","script":"script COMPLET 80-100 mots — naturel, rythmé, avec les 5 éléments — adapté enfants ET parents","concept":"résumé 2-3 phrases de ce qu'on apprend","cta":"call to action fun qui invite à commenter ou taguer un ami","desc":"description YouTube FR 150-200 mots avec hook, résumé complet, invitation à s'abonner à ${chName}","hashtags_yt":"#TropikKids #Shorts #Education #Enfants #FunFacts [5 hashtags FR pertinents]","caption_tt":"caption TikTok FR 2-3 lignes percutantes avec emojis","hashtags_tt":"#ApprendreEnSAmusant #Enfants #Shorts #Education #FunFacts [4 hashtags FR]","caption_ig":"caption Instagram FR 3-4 lignes avec emojis","hashtags_ig":"#Education #Enfants #Shorts #FunFacts #TropikKids [5 hashtags FR]","angle_viral":"pourquoi cette vidéo va être partagée par les parents"}`;
  }
}

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
      console.log(`✅ Gumroad: ${data.product.name}`);
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
  const prompt = `Tu es expert en produits digitaux Gumroad. Crée un produit digital rentable lié au bricolage, électricité, maintenance maison ou astuces pratiques.
Types qui marchent : guides PDF, templates Excel, packs de prompts IA pour artisans, checklists professionnelles.
Prix : $15-35 USD.
Réponds UNIQUEMENT en JSON valide sans markdown :
{"name":"nom du produit en anglais","description":"description Gumroad 200 mots EN — problème, solution, contenu, pour qui","price_cents":2500,"content_outline":"liste 5-8 éléments inclus","marketing_hook":"accroche réseaux sociaux","target_audience":"qui achète exactement"}`;
  const product = await callClaude(prompt);
  console.log(`\n🛍️ Gumroad : ${product.name} — $${product.price_cents / 100}`);
  return product;
}

function buildEmailReport(date, videos, gumroadProduct) {
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#0A0A0F;color:#F8F7FF;margin:0;padding:20px;}
.header{background:linear-gradient(135deg,#7C3AED,#14B8A6);padding:20px;border-radius:12px;margin-bottom:20px;text-align:center;}
.header h1{margin:0;font-size:22px;color:#fff;}
.header p{margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);}
.card{background:#16161F;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;margin-bottom:12px;}
.card h3{margin:0 0 12px;color:#FDE047;font-size:15px;}
.label{font-size:10px;text-transform:uppercase;color:#6B7280;margin-bottom:3px;margin-top:10px;font-weight:600;letter-spacing:0.05em;}
.val{font-size:13px;color:#F8F7FF;background:#1A1A26;padding:9px 12px;border-radius:6px;line-height:1.6;white-space:pre-wrap;}
.script-box{font-size:14px;color:#E8C96A;background:#1A1A26;border:1px solid rgba(253,224,71,0.2);padding:14px;border-radius:8px;line-height:1.9;white-space:pre-wrap;font-style:italic;}
.subs-box{font-size:12px;color:#14B8A6;background:#1A1A26;border:1px solid rgba(20,184,166,0.2);padding:10px;border-radius:8px;line-height:1.8;}
.gumroad{background:#1A2A1A;border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:16px;margin-bottom:12px;}
.gumroad h3{color:#22C55E;margin:0 0 10px;}
.btn{display:inline-block;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:700;margin:4px;font-size:12px;}
.btn-yt{background:#FF0000;}
.btn-tt{background:#010101;border:1px solid #333;}
.btn-ig{background:linear-gradient(135deg,#F58529,#DD2A7B);}
.btn-hg{background:#4A4A8A;}
.btn-gm{background:#22C55E;color:#000;}
.divider{height:1px;background:rgba(255,255,255,0.06);margin:10px 0;}
.footer{text-align:center;font-size:11px;color:#6B7280;margin-top:20px;}
</style></head><body>
<div class="header">
  <h1>🌴 Tropik' Studio — ${date}</h1>
  <p>${videos.length} vidéos générées${gumroadProduct ? ' · 1 produit Gumroad' : ''} · Envoyé automatiquement</p>
</div>`;

  videos.forEach(v => {
    const isPro = v.niche.lang === 'en';
    html += `<div class="card">
  <h3>${v.niche.emoji} ${v.niche.label}${isPro ? ' <span style="font-size:11px;color:#14B8A6;background:rgba(20,184,166,0.1);padding:2px 8px;border-radius:8px;">EN + ST FR</span>' : ''}</h3>
  <div class="label">📝 Titre YouTube</div>
  <div class="val">${v.content.titre || ''}</div>
  <div class="label">🎣 Hook (0-3 sec)</div>
  <div class="val">${v.content.hook || ''}</div>
  <div class="divider"></div>
  <div class="label">🎬 Script complet — coller dans HeyGen / Lumen5 / InVideo</div>
  <div class="script-box">${v.content.script || ''}</div>
  ${isPro && v.content.subtitles_fr ? `
  <div class="label">📝 Sous-titres FR</div>
  <div class="subs-box">${v.content.subtitles_fr.map(s => '[' + s.time + '] ' + s.text).join('\n')}</div>` : ''}
  <div class="divider"></div>
  <div class="label">📄 Description YouTube</div>
  <div class="val">${v.content.desc || ''}</div>
  <div class="label">#️⃣ Hashtags YouTube</div>
  <div class="val">${v.content.hashtags_yt || ''}</div>
  <div class="label">💬 Caption TikTok</div>
  <div class="val">${(v.content.caption_tt || '') + '\n' + (v.content.hashtags_tt || '')}</div>
  <div class="label">📸 Caption Instagram</div>
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
  <div class="label">📝 Contenu inclus</div><div class="val">${Array.isArray(gumroadProduct.content_outline) ? gumroadProduct.content_outline.join('\n') : gumroadProduct.content_outline}</div>
  <div class="label">📣 Hook marketing</div><div class="val">${gumroadProduct.marketing_hook}</div>
  <div class="label">📄 Description complète</div><div class="val">${gumroadProduct.description}</div>
  <div style="margin-top:10px;"><a href="https://app.gumroad.com/products" class="btn btn-gm">✅ Publier sur Gumroad</a></div>
</div>`;
  }

  html += `<div class="footer">🌴 Tropik' Studio Automation · GitHub Actions · ${date}</div></body></html>`;
  return html;
}

async function sendEmail(subject, html) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) { console.log('No Resend key — skipping email'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: "Tropik' Studio <onboarding@resend.dev>",
      to: [EMAIL],
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (data.id) console.log(`✅ Email envoyé à ${EMAIL}`);
  else console.log('Email error:', JSON.stringify(data));
}

// ─── TRACKING DES SUJETS UTILISÉS ────────────────────────────────────────────
const TOTAL_TOPICS = {
  facts: 10, song: 6, emotions: 6, motivation: 5, astuces: 5, humour: 6,
  electricite: 5, bricolage: 5, plomberie: 5, mecanique: 5, jardinage: 5,
};

function getAllTopicsExhausted() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  
  // Vérifie si tous les sujets de toutes les niches ont été générés
  const allNiches = [
    ...Object.keys(TOTAL_TOPICS).filter(k => ['facts','song','emotions','motivation','astuces','humour'].includes(k)),
    ...Object.keys(TOTAL_TOPICS).filter(k => ['electricite','bricolage','plomberie','mecanique','jardinage'].includes(k)),
  ];
  
  for (const nicheId of allNiches) {
    const total = TOTAL_TOPICS[nicheId];
    const cycleDay = dayOfYear % total;
    if (cycleDay !== 0) return false; // Pas encore fait un cycle complet
  }
  
  // Vérifie si on a déjà fait au moins un cycle complet (jour > max sujets)
  const maxTopics = Math.max(...Object.values(TOTAL_TOPICS));
  return dayOfYear > maxTopics && dayOfYear % maxTopics === 0;
}

function getExhaustedEmailHtml(date) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#0A0A0F;color:#F8F7FF;margin:0;padding:20px;}
.card{background:#16161F;border:1px solid rgba(253,224,71,0.3);border-radius:12px;padding:24px;text-align:center;max-width:600px;margin:0 auto;}
h1{color:#FDE047;font-size:24px;margin-bottom:12px;}
p{color:rgba(255,255,255,0.7);line-height:1.7;font-size:14px;}
.btn{display:inline-block;background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;}
</style></head><body>
<div class="card">
  <h1>🎉 Tous les sujets ont été générés !</h1>
  <p>Tropik' Studio a épuisé tous les sujets disponibles pour toutes les niches.<br><br>
  Pour continuer à recevoir de nouvelles idées, ajoute de nouveaux sujets dans le fichier <strong>daily.js</strong> sur GitHub dans les tableaux ROTATION et PRO_ROTATION.<br><br>
  Tu peux aussi relancer le cycle depuis le début en ne faisant rien — le système reprendra automatiquement depuis le premier sujet.</p>
  <a href="https://github.com/mtmoufamily-cell/abs-automation/blob/main/scripts/daily.js" class="btn">✏️ Ajouter de nouveaux sujets</a>
  <p style="margin-top:16px;font-size:12px;color:#6B7280;">Date : ${date}</p>
</div>
</body></html>`;
}

async function main() {
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isMonday = new Date().getDay() === 1;

  console.log(`\n🌴 Tropik' Studio Automation — ${date}`);
  console.log('─'.repeat(50));

  // Vérifie si tous les sujets ont déjà été générés
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const maxTopics = Math.max(...Object.values(TOTAL_TOPICS));
  
  if (dayOfYear > maxTopics && dayOfYear % maxTopics === 0) {
    console.log('\n✅ Tous les sujets ont été générés — envoi email de notification...');
    await sendEmail(
      "🎉 Tropik' Studio — Tous les sujets épuisés !",
      getExhaustedEmailHtml(date)
    );
    console.log('Email envoyé. Arrêt du script.');
    return;
  }
  
  console.log(`📅 Jour ${dayOfYear} de l'année — sujet index: ${dayOfYear % maxTopics + 1}/${maxTopics}`);

  const allNiches = [...KIDS_NICHES, ...PRO_NICHES];
  const videos = [];

  for (const niche of allNiches) {
    try {
      console.log(`\n⏳ ${niche.emoji} ${niche.label}...`);
      const content = await callClaude(getPrompt(niche));
      videos.push({ niche, content });
      console.log(`✅ ${content.titre || content.hook || 'OK'}`);
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
  const results = {
    date,
    generated_at: new Date().toISOString(),
    videos: videos.map(v => ({ niche: v.niche, content: v.content })),
    gumroad_product: gumroadProduct,
  };
  fs.writeFileSync('./products/latest.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Résultats sauvegardés');

  await sendEmail(`🌴 Tropik' Studio — ${videos.length} vidéos — ${date}`, buildEmailReport(date, videos, gumroadProduct));
  console.log(`\n✅ Terminé ! ${videos.length} vidéos${gumroadProduct ? ' + 1 Gumroad' : ''}`);
}

main().catch(e => { console.error('Erreur fatale:', e); process.exit(1); });
