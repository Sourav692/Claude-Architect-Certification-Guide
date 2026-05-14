const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/sourav.banerjee/.claude/skills/pptx/scripts/html2pptx');

const SLIDES_DIR = path.join(__dirname, 'slides');

// ---- Slide data -----------------------------------------------------------

const sections = [
  { num: '02', label: 'CATEGORY TWO', title: 'Workflow & Orchestration',
    desc: 'How agents separate exploration from execution, isolate context, and run parallel work safely.',
    count: 'THREE PATTERNS  ·  #6 — #8' },
  { num: '03', label: 'CATEGORY THREE', title: 'Tools & Permissions',
    desc: 'How tool surfaces are shaped and gated so agents act with precision and safe defaults.',
    count: 'THREE PATTERNS  ·  #9 — #11' },
  { num: '04', label: 'CATEGORY FOUR', title: 'Automation',
    desc: 'How deterministic harness behavior fills the gaps that prompts cannot reliably cover.',
    count: 'ONE PATTERN  ·  #12' }
];

const patterns = [
  { n: '01', cat: 'MEMORY & CONTEXT', accent: 'purple', name: 'Persistent Instruction File',
    tag: 'CLAUDE.md / project config',
    body: 'A project-level config file loaded at session start carrying conventions, standards, and recurring context.',
    bullets: [
      'Loaded automatically — no re-prompting required',
      'Captures style guides, safety rules, and team norms',
      'Removes the burden of repeating context every session'
    ]},
  { n: '02', cat: 'MEMORY & CONTEXT', accent: 'purple', name: 'Scoped Context Assembly',
    tag: 'Layered config loading',
    body: 'Instructions are composed dynamically from organization, project, and directory levels — agents see only what is relevant where they are.',
    bullets: [
      'Resolves rules nearest to the file under work',
      'Org-wide policies + repo-local overrides compose cleanly',
      'Prevents cross-project rule contamination'
    ]},
  { n: '03', cat: 'MEMORY & CONTEXT', accent: 'purple', name: 'Tiered Memory',
    tag: 'Index → topic → transcript',
    body: 'Memory split into a compact always-loaded index, topic files fetched on demand, and full transcripts searched only when needed.',
    bullets: [
      'Pay context cost only for the layer in use',
      'Preserves recall without bloating every prompt',
      'Mirrors human working / long-term memory'
    ]},
  { n: '04', cat: 'MEMORY & CONTEXT', accent: 'purple', name: 'Dream Consolidation',
    tag: '"Garbage collection for state"',
    body: 'Background processes deduplicate, prune, and reorganize agent memory during idle time — keeping the catalog coherent over weeks of use.',
    bullets: [
      'Runs out-of-band, not on the hot path',
      'Removes contradictions and stale entries',
      'Treats memory as a maintained system, not an append log'
    ]},
  { n: '05', cat: 'MEMORY & CONTEXT', accent: 'purple', name: 'Progressive Context Compaction',
    tag: 'Multi-stage compression',
    body: 'When context windows fill, recent turns stay detailed while older turns are progressively collapsed — preserving signal without breaking continuity.',
    bullets: [
      'Most recent N turns kept verbatim',
      'Older turns summarized in tiers',
      'Conversation can run effectively unbounded'
    ]},
  { n: '06', cat: 'WORKFLOW & ORCHESTRATION', accent: 'emerald', name: 'Explore-Plan-Act Loop',
    tag: 'Read → decide → write',
    body: 'Tasks split into a read-only exploration phase, an explicit planning step, and only then execution — preventing premature edits.',
    bullets: [
      'Discovery cannot mutate state',
      'Plan is reviewable before any change lands',
      'Drastically lowers "wrong but confident" failures'
    ]},
  { n: '07', cat: 'WORKFLOW & ORCHESTRATION', accent: 'emerald', name: 'Context-Isolated Subagents',
    tag: 'Specialist with narrowed view',
    body: 'Specialized agents run with their own clean context and a restricted toolset, seeing only what their job requires.',
    bullets: [
      'Prevents cross-task context pollution',
      'Tool restrictions enforce scope of authority',
      'Parent agent receives only the result, not the trace'
    ]},
  { n: '08', cat: 'WORKFLOW & ORCHESTRATION', accent: 'emerald', name: 'Fork-Join Parallelism',
    tag: 'Independent worktrees, then merge',
    body: 'Spawn parallel subagents on independent repo copies, work concurrently, then merge results — ideal for decomposable tasks.',
    bullets: [
      'No serialization on shared filesystem state',
      'Failed branches discarded without contamination',
      'Wall-clock time scales with workers, not work'
    ]},
  { n: '09', cat: 'TOOLS & PERMISSIONS', accent: 'purple', name: 'Progressive Tool Expansion',
    tag: 'Lazy tool loading',
    body: 'Start with ~20 default tools; activate specialized tools only when needed. The model picks from a smaller, sharper set.',
    bullets: [
      'Reduces selection error and prompt overhead',
      'Specialized tools surface on demand',
      'Default surface stays predictable'
    ]},
  { n: '10', cat: 'TOOLS & PERMISSIONS', accent: 'purple', name: 'Command Risk Classification',
    tag: 'Pre-parse, then approve',
    body: 'Shell commands are classified by deterministic rules: low-risk auto-approved, dangerous ones flagged for human review.',
    bullets: [
      'Approval logic lives outside the model',
      'Stops "run rm -rf because it sounded right"',
      'Human-in-the-loop only where it actually matters'
    ]},
  { n: '11', cat: 'TOOLS & PERMISSIONS', accent: 'purple', name: 'Single-Purpose Tool Design',
    tag: 'Typed tools beat raw shell',
    body: 'Replace general-purpose shells with typed tools — FileReadTool, GrepTool, EditTool — each with clear contracts and permissions.',
    bullets: [
      'Permissions and audit logs become legible',
      'Less ambiguity in tool selection',
      'Errors localize to the right interface'
    ]},
  { n: '12', cat: 'AUTOMATION', accent: 'emerald', name: 'Deterministic Lifecycle Hooks',
    tag: 'Harness, not prompt',
    body: 'Critical commands run automatically at defined lifecycle points — pre-commit, post-edit, on-stop — instead of relying on the model to remember.',
    bullets: [
      'Steps that must always run, always run',
      'Removes "the agent forgot to run tests" failures',
      'Configuration is auditable and versioned'
    ]}
];

// ---- HTML templates --------------------------------------------------------

function sectionHTML(s) {
  return `<!DOCTYPE html>
<html><head><style>
html { background: #181B24; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; background: #181B24; font-family: Arial, sans-serif; display: flex; color: #FCFCFC; }
.frame { margin: 50pt; width: 620pt; display: flex; align-items: center; gap: 36pt; }
.left { flex: 0 0 200pt; }
.right { flex: 1; }
.bigNum { font-size: 180pt; font-weight: bold; line-height: 1; margin: 0; color: #B165FB; }
.label { font-size: 12pt; letter-spacing: 4pt; color: #4FB89E; font-weight: bold; margin: 0 0 14pt 0; }
.bar { width: 80pt; height: 4pt; background: #B165FB; margin: 0 0 22pt 0; }
.title { font-size: 44pt; font-weight: bold; line-height: 1.1; margin: 0 0 16pt 0; color: #FCFCFC; }
.desc { font-size: 16pt; line-height: 1.5; color: #C9CFDB; margin: 0; }
.count { font-size: 13pt; color: #B165FB; margin: 18pt 0 0 0; letter-spacing: 2pt; font-weight: bold; }
</style></head><body>
<div class="frame">
  <div class="left"><p class="bigNum">${s.num}</p></div>
  <div class="right">
    <p class="label">${s.label}</p>
    <div class="bar"></div>
    <h1 class="title">${s.title}</h1>
    <p class="desc">${s.desc}</p>
    <p class="count">${s.count}</p>
  </div>
</div>
</body></html>`;
}

function patternHTML(p) {
  const accentColor = p.accent === 'emerald' ? '#4FB89E' : '#B165FB';
  const altColor = p.accent === 'emerald' ? '#B165FB' : '#4FB89E';
  const bullets = p.bullets.map(b => `<li>${b}</li>`).join('');
  return `<!DOCTYPE html>
<html><head><style>
html { background: #181B24; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; background: #181B24; font-family: Arial, sans-serif; display: flex; color: #FCFCFC; }
.frame { margin: 40pt 50pt; width: 620pt; display: flex; flex-direction: column; }
.head { display: flex; align-items: flex-start; gap: 20pt; margin-bottom: 18pt; }
.numBox { background: ${accentColor}; color: #181B24; padding: 8pt 16pt; }
.numBox p { font-size: 28pt; font-weight: bold; margin: 0; line-height: 1; }
.headRight { flex: 1; }
.cat { font-size: 11pt; letter-spacing: 3pt; color: ${altColor}; font-weight: bold; margin: 4pt 0 6pt 0; }
.name { font-size: 30pt; font-weight: bold; margin: 0; line-height: 1.1; color: #FCFCFC; }
.tag { font-size: 12pt; color: #AAB0BF; font-style: italic; margin: 6pt 0 0 0; }
.bar { width: 100%; height: 1pt; background: #2E323F; margin: 14pt 0 18pt 0; }
.body { display: flex; gap: 28pt; }
.body .lede { flex: 1.1; font-size: 15pt; line-height: 1.55; color: #DDE2EC; margin: 0; }
.body ul { flex: 0.9; margin: 0; padding-left: 20pt; }
.body li { font-size: 13pt; line-height: 1.55; color: #C9CFDB; margin-bottom: 8pt; }
.footer { margin-top: auto; padding-top: 14pt; display: flex; justify-content: space-between; font-size: 10pt; color: #5A6072; letter-spacing: 2pt; }
</style></head><body>
<div class="frame">
  <div class="head">
    <div class="numBox"><p>${p.n}</p></div>
    <div class="headRight">
      <p class="cat">${p.cat}</p>
      <h1 class="name">${p.name}</h1>
      <p class="tag">${p.tag}</p>
    </div>
  </div>
  <div class="bar"></div>
  <div class="body">
    <p class="lede">${p.body}</p>
    <ul>${bullets}</ul>
  </div>
  <div class="footer"><p>PATTERN ${p.n} OF 12</p><p>CLAUDE CODE HARNESS</p></div>
</div>
</body></html>`;
}

function takeawaysHTML() {
  return `<!DOCTYPE html>
<html><head><style>
html { background: #181B24; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; background: #181B24; font-family: Arial, sans-serif; display: flex; color: #FCFCFC; }
.frame { margin: 50pt; width: 620pt; display: flex; flex-direction: column; }
.label { font-size: 12pt; letter-spacing: 4pt; color: #B165FB; font-weight: bold; margin: 0; }
.bar { width: 60pt; height: 3pt; background: #B165FB; margin: 12pt 0 22pt 0; }
.h1 { font-size: 36pt; font-weight: bold; line-height: 1.15; margin: 0 0 22pt 0; color: #FCFCFC; }
.cards { display: flex; gap: 16pt; }
.card { flex: 1; background: #21242F; padding: 18pt; border-top: 4pt solid #B165FB; }
.card.emerald { border-top-color: #4FB89E; }
.card .num { font-size: 11pt; letter-spacing: 2pt; color: #B165FB; font-weight: bold; margin: 0 0 8pt 0; }
.card.emerald .num { color: #4FB89E; }
.card .head { font-size: 15pt; font-weight: bold; margin: 0 0 8pt 0; color: #FCFCFC; line-height: 1.25; }
.card .body { font-size: 12pt; line-height: 1.5; color: #C9CFDB; margin: 0; }
.footer { margin-top: 28pt; padding-top: 14pt; border-top: 1pt solid #2E323F; font-size: 12pt; color: #AAB0BF; line-height: 1.5; }
.footer b { color: #FCFCFC; }
</style></head><body>
<div class="frame">
  <p class="label">KEY TAKEAWAYS</p>
  <div class="bar"></div>
  <h1 class="h1">Architecture is the agent reliability story</h1>
  <div class="cards">
    <div class="card"><p class="num">01 — STRUCTURE</p><p class="head">Memory has shape</p><p class="body">Tiers, scopes, and compaction are deliberate engineering — not side effects of the prompt.</p></div>
    <div class="card emerald"><p class="num">02 — SEPARATION</p><p class="head">Phases beat freestyling</p><p class="body">Explore, plan, act — and isolate subagents — to keep failure modes local.</p></div>
    <div class="card"><p class="num">03 — GATING</p><p class="head">Tools are policy</p><p class="body">Typed tools and risk classification put permissions where they belong: outside the model.</p></div>
    <div class="card emerald"><p class="num">04 — DETERMINISM</p><p class="head">Hooks, not hopes</p><p class="body">Lifecycle hooks guarantee the steps that prompts can never reliably enforce.</p></div>
  </div>
  <div class="footer"><p>The patterns survive model changes. <b>The harness is where reliability lives</b> — and these twelve are its load-bearing walls.</p></div>
</div>
</body></html>`;
}

// ---- Write HTML files ------------------------------------------------------

// Slides 1-3 already exist. Generate 4-19.
// Order: patterns 1-5 (slides 4-8), section 2 (9), patterns 6-8 (10-12),
// section 3 (13), patterns 9-11 (14-16), section 4 (17), pattern 12 (18), takeaways (19).

const order = [];
order.push({ idx: 4, html: patternHTML(patterns[0]) });
order.push({ idx: 5, html: patternHTML(patterns[1]) });
order.push({ idx: 6, html: patternHTML(patterns[2]) });
order.push({ idx: 7, html: patternHTML(patterns[3]) });
order.push({ idx: 8, html: patternHTML(patterns[4]) });
order.push({ idx: 9, html: sectionHTML(sections[0]) });
order.push({ idx: 10, html: patternHTML(patterns[5]) });
order.push({ idx: 11, html: patternHTML(patterns[6]) });
order.push({ idx: 12, html: patternHTML(patterns[7]) });
order.push({ idx: 13, html: sectionHTML(sections[1]) });
order.push({ idx: 14, html: patternHTML(patterns[8]) });
order.push({ idx: 15, html: patternHTML(patterns[9]) });
order.push({ idx: 16, html: patternHTML(patterns[10]) });
order.push({ idx: 17, html: sectionHTML(sections[2]) });
order.push({ idx: 18, html: patternHTML(patterns[11]) });
order.push({ idx: 19, html: takeawaysHTML() });

for (const o of order) {
  fs.writeFileSync(path.join(SLIDES_DIR, `slide${o.idx}.html`), o.html);
}

// ---- Build PPTX ------------------------------------------------------------

(async () => {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = '12 Agentic Harness Patterns from Claude Code';
  pptx.author = 'Sourav Banerjee';

  for (let i = 1; i <= 19; i++) {
    await html2pptx(path.join(SLIDES_DIR, `slide${i}.html`), pptx);
  }

  const out = '/Users/sourav.banerjee/Documents/2. Codebases/Claude Architect Certification/12_agentic_harness_patterns.pptx';
  await pptx.writeFile({ fileName: out });
  console.log('Wrote', out);
})().catch(e => { console.error(e); process.exit(1); });
