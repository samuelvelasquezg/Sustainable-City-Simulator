/* =============================================
   SUSTAINABLE CITY SIMULATOR — script.js  v2
   IB Extended Exhibition — Technology & Sustainability

   Structure:
     1. DOM references
     2. Calculation engine
     3. Badge / colour helpers
     4. Conclusion generator
     5. Star rating
     6. Canvas city renderer
     7. Main update function
     8. Reset function
     9. Event listeners + initial render
============================================= */


/* =============================================
   1. DOM REFERENCES
============================================= */

const sliders = {
  transport: document.getElementById('transport'),
  green:     document.getElementById('green'),
  energy:    document.getElementById('energy'),
  recycling: document.getElementById('recycling'),
  cars:      document.getElementById('cars'),
};

const valueDisplays = {
  transport: document.getElementById('val-transport'),
  green:     document.getElementById('val-green'),
  energy:    document.getElementById('val-energy'),
  recycling: document.getElementById('val-recycling'),
  cars:      document.getElementById('val-cars'),
};

const scores = {
  pollution:      document.getElementById('score-pollution'),
  qol:            document.getElementById('score-qol'),
  cost:           document.getElementById('score-cost'),
  sustainability: document.getElementById('score-sustainability'),
};

const bars = {
  pollution:      document.getElementById('bar-pollution'),
  qol:            document.getElementById('bar-qol'),
  cost:           document.getElementById('bar-cost'),
  sustainability: document.getElementById('bar-sustainability'),
};

const badges = {
  pollution:      document.getElementById('badge-pollution'),
  qol:            document.getElementById('badge-qol'),
  cost:           document.getElementById('badge-cost'),
  sustainability: document.getElementById('badge-sustainability'),
};

const conclusionEl  = document.getElementById('conclusion-text');
const ratingStarsEl = document.getElementById('rating-stars');
const canvas        = document.getElementById('cityCanvas');
const ctx           = canvas.getContext('2d');


/* =============================================
   2. CALCULATION ENGINE

   Each metric is a weighted linear combination
   of the five input variables (0–100).
   Weights reflect logical, directional
   relationships that are easy to justify
   in a class or oral presentation.
   All outputs are clamped to [0, 100].
============================================= */

/**
 * Computes the four outcome metrics.
 *
 * @param {number} t  Public transport  (0–100)
 * @param {number} g  Green zones       (0–100)
 * @param {number} e  Renewable energy  (0–100)
 * @param {number} r  Recycling         (0–100)
 * @param {number} c  Private cars      (0–100)
 * @returns {{ pollution, qol, cost, sustainability }}
 */
function calculateMetrics(t, g, e, r, c) {

  /* ---- POLLUTION (lower = better) ----
     Cars are the primary driver.
     Transport, green zones, and renewables each reduce it.
     Recycling has a small beneficial effect.              */
  let pollution =
      c  * 0.40   // Cars strongly increase pollution
    - t  * 0.25   // Transport reduces car dependency
    - g  * 0.18   // Green zones absorb CO2
    - e  * 0.20   // Renewables displace fossil fuels
    - r  * 0.07   // Recycling cuts landfill emissions
    + 50;         // Baseline: 50 at all-neutral settings

  /* ---- QUALITY OF LIFE (higher = better) ----
     Green spaces and accessible transport matter most.
     Car congestion and noise reduce liveability.          */
  let qol =
      g  * 0.35   // Green zones are central to wellbeing
    + t  * 0.25   // Transport access improves daily life
    + e  * 0.10   // Cleaner air benefits health
    + r  * 0.08   // Cleaner city environment
    - c  * 0.18   // Congestion and noise reduce liveability
    + 10;         // Baseline offset

  /* ---- ECONOMIC COST (lower = better) ----
     Renewable and transport infrastructure have upfront costs.
     Cars add congestion externalities.
     Recycling delivers long-run savings.                  */
  let cost =
      e  * 0.22   // Renewable infrastructure is capital-intensive
    + t  * 0.18   // Transit infrastructure needs investment
    + c  * 0.20   // Car-centric infrastructure has social cost
    - r  * 0.10   // Recycling reduces waste-management costs
    - g  * 0.05   // Green zones provide minor economic savings
    + 15;         // Baseline offset

  /* ---- OVERALL SUSTAINABILITY (higher = better) ----
     A composite index of long-term environmental viability.
     Transport, energy, and green zones are key pillars.
     Cars are the single largest negative factor.         */
  let sustainability =
      t  * 0.28   // Public transport is a core pillar
    + g  * 0.22   // Green infrastructure is fundamental
    + e  * 0.28   // Renewables underpin green cities
    + r  * 0.12   // Circular economy contribution
    - c  * 0.30   // Fossil-fuel car dependency is the biggest risk
    + 10;         // Baseline offset

  // Clamp all values to the 0–100 range
  const clamp = v => Math.round(Math.min(100, Math.max(0, v)));

  return {
    pollution:      clamp(pollution),
    qol:            clamp(qol),
    cost:           clamp(cost),
    sustainability: clamp(sustainability),
  };
}


/* =============================================
   3. BADGE AND COLOUR HELPERS
============================================= */

/** Label for metrics where LOWER is better (pollution, cost) */
function badgeLow(value) {
  if (value >= 75) return 'Critical';
  if (value >= 55) return 'High';
  if (value >= 35) return 'Moderate';
  if (value >= 15) return 'Low';
  return 'Minimal';
}

/** Label for metrics where HIGHER is better (qol, sustainability) */
function badgeHigh(value) {
  if (value >= 80) return 'Excellent';
  if (value >= 60) return 'Good';
  if (value >= 40) return 'Moderate';
  if (value >= 20) return 'Poor';
  return 'Critical';
}

/**
 * Returns a CSS colour for the large score number
 * based on whether a high value is good or bad.
 */
function scoreColor(metric, value) {
  const GREEN = '#3fb950';
  const AMBER = '#d29922';
  const RED   = '#f85149';
  const BLUE  = '#58a6ff';

  // Sustainability always shown in blue (informational)
  if (metric === 'sustainability') return BLUE;

  // For pollution and cost: high is bad
  if (metric === 'pollution' || metric === 'cost') {
    if (value < 35) return GREEN;
    if (value < 65) return AMBER;
    return RED;
  }

  // For quality of life: high is good
  if (value > 65) return GREEN;
  if (value > 35) return AMBER;
  return RED;
}


/* =============================================
   4. CONCLUSION GENERATOR

   Produces a concise, plain-English diagnosis
   of the city based on the current metric values
   and key slider positions. Kept short so it
   reads naturally during an oral presentation.
============================================= */

function generateConclusion(metrics, inputs) {
  const { pollution, qol, cost, sustainability } = metrics;
  const { t, g, e, r, c } = inputs;

  const problems  = [];
  const strengths = [];

  // Identify notable problems
  if (pollution > 65)      problems.push('high pollution');
  if (qol < 35)            problems.push('poor quality of life');
  if (cost > 65)           problems.push('a heavy economic burden');
  if (sustainability < 35) problems.push('an unsustainable trajectory');

  // Identify notable strengths
  if (pollution < 35)      strengths.push('clean air');
  if (qol > 65)            strengths.push('a high quality of life');
  if (cost < 35)           strengths.push('efficient use of public funds');
  if (sustainability > 65) strengths.push('strong overall sustainability');

  let text = '';

  // Opening sentence — overall status
  if (sustainability >= 70 && pollution <= 30) {
    text += 'This city represents a strong model of sustainable urban planning. ';
  } else if (sustainability >= 50 && pollution <= 50) {
    text += 'The city is on a reasonable path, but further policy improvements are possible. ';
  } else if (sustainability < 30 || pollution > 70) {
    text += 'The city is in a critical state: current policies are generating serious environmental and social costs. ';
  } else {
    text += 'The city shows a mixed picture — some policies are effective while others are pulling in the wrong direction. ';
  }

  // Strengths
  if (strengths.length > 0) {
    text += 'Current strengths include ' + strengths.join(' and ') + '. ';
  }

  // Problems
  if (problems.length > 0) {
    text += 'Key concerns are ' + problems.join(', ') + '. ';
  }

  // Specific policy remarks (most impactful levers)
  if (c > 70) {
    text += 'The high reliance on private cars is the single biggest driver of pollution. ';
  }
  if (t > 70) {
    text += 'Strong public transport investment is reducing emissions and improving mobility. ';
  }
  if (e > 70) {
    text += 'The shift to renewables is making a significant difference to the city\'s carbon output. ';
  }
  if (g < 20) {
    text += 'The near-absence of green zones is harming both air quality and wellbeing. ';
  }

  // Closing recommendation
  if (sustainability < 50) {
    text += 'Recommended actions: reduce car infrastructure, expand renewables, and invest in green zones.';
  } else {
    text += 'Continue balancing cost, liveability, and environmental performance.';
  }

  return text;
}


/* =============================================
   5. STAR RATING

   Maps sustainability and pollution to a 1–5
   star rating using a simple weighted score.
   Unicode star characters — no images needed.
============================================= */

function starRating(sustainability, pollution) {
  const score = sustainability * 0.6 + (100 - pollution) * 0.4;

  if (score >= 82) return '\u2605\u2605\u2605\u2605\u2605'; // 5 stars
  if (score >= 65) return '\u2605\u2605\u2605\u2605\u2606'; // 4 stars
  if (score >= 48) return '\u2605\u2605\u2605\u2606\u2606'; // 3 stars
  if (score >= 30) return '\u2605\u2605\u2606\u2606\u2606'; // 2 stars
  return '\u2605\u2606\u2606\u2606\u2606';                  // 1 star
}


/* =============================================
   6. CANVAS CITY RENDERER

   Draws a simple stylised city skyline that
   reacts to the current pollution and
   sustainability values.

   - Sky colour shifts from clear blue (low
     pollution) to grey-brown (high pollution).
   - Ground colour shifts from grey-green to
     richer green as sustainability rises.
   - Trees appear as sustainability increases.
   - A smog layer fades in above 30% pollution.
   - A sun disc brightens with sustainability.
============================================= */

function drawCity(pollution, sustainability) {
  // Match canvas pixel size to its CSS display size
  const W = canvas.offsetWidth  || 700;
  const H = canvas.offsetHeight || 150;
  canvas.width  = W;
  canvas.height = H;

  ctx.clearRect(0, 0, W, H);

  const pRatio = pollution      / 100; // 0 = clean, 1 = polluted
  const sRatio = sustainability / 100; // 0 = low,   1 = high

  // ---- Sky gradient ----
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
  const r1 = Math.round(14  + pRatio * 55);
  const g1 = Math.round(42  - pRatio * 12);
  const b1 = Math.round(82  - pRatio * 42);
  const r2 = Math.round(18  + pRatio * 65);
  const g2 = Math.round(32  + pRatio * 18);
  const b2 = Math.round(62  - pRatio * 30);
  skyGrad.addColorStop(0, `rgb(${r1},${g1},${b1})`);
  skyGrad.addColorStop(1, `rgb(${r2},${g2},${b2})`);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // ---- Ground ----
  const groundY = H * 0.72;
  const gR = Math.round(28 - sRatio *  8);
  const gG = Math.round(32 + sRatio * 48);
  const gB = Math.round(18 + sRatio * 12);
  ctx.fillStyle = `rgb(${gR},${gG},${gB})`;
  ctx.fillRect(0, groundY, W, H - groundY);

  // ---- Buildings ----
  // Each building: { x (fraction of W), w (px), h (fraction of groundY) }
  const buildings = [
    { x: 0.05, w: 48,  h: 0.54 },
    { x: 0.13, w: 33,  h: 0.39 },
    { x: 0.20, w: 58,  h: 0.64 },
    { x: 0.30, w: 38,  h: 0.47 },
    { x: 0.38, w: 52,  h: 0.71 },
    { x: 0.48, w: 42,  h: 0.49 },
    { x: 0.55, w: 66,  h: 0.67 },
    { x: 0.66, w: 38,  h: 0.43 },
    { x: 0.73, w: 52,  h: 0.57 },
    { x: 0.82, w: 33,  h: 0.37 },
    { x: 0.88, w: 56,  h: 0.59 },
  ];

  buildings.forEach(b => {
    const bx = b.x * W;
    const bh = b.h * groundY;
    const by = groundY - bh;

    // Building body
    const shade = Math.round(32 + sRatio * 18);
    ctx.fillStyle = `rgb(${shade + 4}, ${shade + 7}, ${shade + 14})`;
    ctx.fillRect(bx, by, b.w, bh);

    // Edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, b.w, bh);

    // Windows
    const cols = Math.floor(b.w / 11);
    const rows = Math.floor(bh / 13);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Deterministic "random" lit / unlit based on position
        const lit = ((row * 7 + col * 13 + Math.floor(b.x * 100)) % 5) < 3;
        ctx.fillStyle = lit
          ? `rgba(255, 238, 150, ${0.45 + sRatio * 0.3})`
          : 'rgba(28, 38, 58, 0.6)';
        ctx.fillRect(bx + 4 + col * 10, by + 7 + row * 12, 5, 6);
      }
    }
  });

  // ---- Trees (quantity rises with sustainability) ----
  const treeCount    = Math.round(2 + sRatio * 7);
  const treeXSlots   = [0.02, 0.10, 0.28, 0.36, 0.52, 0.60, 0.70, 0.78, 0.94];
  for (let i = 0; i < treeCount && i < treeXSlots.length; i++) {
    drawTree(treeXSlots[i] * W, groundY, sRatio);
  }

  // ---- Smog layer (visible above 30% pollution) ----
  if (pollution > 30) {
    const alpha = ((pollution - 30) / 100) * 0.42;
    const smog  = ctx.createLinearGradient(0, groundY * 0.45, 0, groundY);
    smog.addColorStop(0, `rgba(115, 105, 75, 0)`);
    smog.addColorStop(1, `rgba(115, 105, 75, ${alpha})`);
    ctx.fillStyle = smog;
    ctx.fillRect(0, groundY * 0.45, W, groundY * 0.55);
  }

  // ---- Sun (brighter with higher sustainability) ----
  const sunAlpha = 0.12 + sRatio * 0.50;
  const sx = W * 0.87;
  const sy = H * 0.18;
  const sr = 18;

  // Glow halo
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2.5);
  glow.addColorStop(0,   `rgba(210, 153, 34, ${sunAlpha * 0.7})`);
  glow.addColorStop(0.5, `rgba(210, 153, 34, ${sunAlpha * 0.2})`);
  glow.addColorStop(1,   `rgba(210, 153, 34, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sx, sy, sr * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Sun disc
  ctx.fillStyle = `rgba(210, 153, 34, ${sunAlpha + 0.18})`;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws a simple two-circle tree at (x, baseY).
 * Tree size and greenness scale with sRatio.
 */
function drawTree(x, baseY, sRatio) {
  const trunkH = 12 + sRatio * 8;
  const crownR = 9  + sRatio * 6;

  // Trunk
  ctx.fillStyle = 'rgb(55, 36, 18)';
  ctx.fillRect(x - 2, baseY - trunkH, 4, trunkH);

  // Main crown
  const g1 = Math.round(48  + sRatio * 80);
  ctx.fillStyle = `rgb(18, ${g1}, 28)`;
  ctx.beginPath();
  ctx.arc(x, baseY - trunkH - crownR * 0.55, crownR, 0, Math.PI * 2);
  ctx.fill();

  // Secondary crown (offset left — adds depth)
  const g2 = Math.round(75 + sRatio * 95);
  ctx.fillStyle = `rgb(26, ${g2}, 38)`;
  ctx.beginPath();
  ctx.arc(x - crownR * 0.30, baseY - trunkH - crownR * 0.28, crownR * 0.72, 0, Math.PI * 2);
  ctx.fill();
}


/* =============================================
   7. MAIN UPDATE FUNCTION

   Called every time a slider moves.
   Reads all inputs, computes metrics, then
   updates scores, bars, badges, conclusion,
   rating, and the canvas.
============================================= */

function updateSimulation() {

  // Read current slider values as integers
  const t = parseInt(sliders.transport.value, 10);
  const g = parseInt(sliders.green.value,     10);
  const e = parseInt(sliders.energy.value,    10);
  const r = parseInt(sliders.recycling.value, 10);
  const c = parseInt(sliders.cars.value,      10);

  // Update inline value labels beside each slider
  valueDisplays.transport.textContent = t;
  valueDisplays.green.textContent     = g;
  valueDisplays.energy.textContent    = e;
  valueDisplays.recycling.textContent = r;
  valueDisplays.cars.textContent      = c;

  // Compute the four outcome metrics
  const m = calculateMetrics(t, g, e, r, c);

  // ---- Pollution ----
  scores.pollution.textContent  = m.pollution;
  scores.pollution.style.color  = scoreColor('pollution', m.pollution);
  bars.pollution.style.width    = m.pollution + '%';
  badges.pollution.textContent  = badgeLow(m.pollution);

  // ---- Quality of Life ----
  scores.qol.textContent  = m.qol;
  scores.qol.style.color  = scoreColor('qol', m.qol);
  bars.qol.style.width    = m.qol + '%';
  badges.qol.textContent  = badgeHigh(m.qol);

  // ---- Economic Cost ----
  scores.cost.textContent  = m.cost;
  scores.cost.style.color  = scoreColor('cost', m.cost);
  bars.cost.style.width    = m.cost + '%';
  badges.cost.textContent  = badgeLow(m.cost);

  // ---- Overall Sustainability ----
  scores.sustainability.textContent  = m.sustainability;
  bars.sustainability.style.width    = m.sustainability + '%';
  badges.sustainability.textContent  = badgeHigh(m.sustainability);

  // ---- Conclusion ----
  conclusionEl.textContent = generateConclusion(m, { t, g, e, r, c });

  // ---- Star rating ----
  ratingStarsEl.textContent = starRating(m.sustainability, m.pollution);

  // ---- Canvas ----
  drawCity(m.pollution, m.sustainability);
}


/* =============================================
   8. RESET FUNCTION

   Returns all sliders to the neutral value (50)
   and re-runs the update cycle.
============================================= */

function resetSimulation() {
  sliders.transport.value  = 50;
  sliders.green.value      = 50;
  sliders.energy.value     = 50;
  sliders.recycling.value  = 50;
  sliders.cars.value       = 50;
  updateSimulation();
}


/* =============================================
   9. EVENT LISTENERS + INITIAL RENDER
============================================= */

// Update in real time as any slider moves
Object.values(sliders).forEach(slider => {
  slider.addEventListener('input', updateSimulation);
});

// Redraw the canvas if the window is resized
window.addEventListener('resize', () => {
  const t = parseInt(sliders.transport.value, 10);
  const g = parseInt(sliders.green.value,     10);
  const e = parseInt(sliders.energy.value,    10);
  const r = parseInt(sliders.recycling.value, 10);
  const c = parseInt(sliders.cars.value,      10);
  const m = calculateMetrics(t, g, e, r, c);
  drawCity(m.pollution, m.sustainability);
});

// Populate everything on first load
updateSimulation();
