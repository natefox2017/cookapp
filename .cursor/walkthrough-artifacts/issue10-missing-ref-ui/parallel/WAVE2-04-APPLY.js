// use_figma · skillNames: figma-use · fileKey FHbikS2jILAeMv8mote0vD
// COOK-04 extras: 04b 402:9328 + 04d 402:9387 only. Do not touch 04c/04 main/NAV/header sets.
const page = figma.root.children.find((p) => p.name.includes('Recording Reproduction'));
await figma.setCurrentPageAsync(page);

const GREEN = { r: 0, g: 0.7411764860153198, b: 0.33725491166114807 };
const INK = { r: 0.10980392247438431, g: 0.10980392247438431, b: 0.11764705926179886 };

function findNamed(root, name) {
  if (!root || !('children' in root)) return null;
  for (const c of root.children) {
    if (c.name === name) return c;
    const inner = findNamed(c, name);
    if (inner) return inner;
  }
  return null;
}

async function fillIfEmpty(target, src) {
  if (!target || !src || !('children' in target) || !('children' in src)) return { skipped: true };
  if (target.children.length > 0) return { already: target.children.length };
  const cloned = [];
  for (const ch of src.children) {
    const cl = ch.clone();
    target.appendChild(cl);
    cloned.push(cl.name);
  }
  return { cloned };
}

// --- 04b Timers ---
const pbB = await figma.getNodeByIdAsync('458:3820');
pbB.visible = false;
pbB.layoutPositioning = 'ABSOLUTE';
pbB.x = 0;
pbB.y = 0;

const heroB = await figma.getNodeByIdAsync('402:9329');
heroB.visible = true;
heroB.resize(440, 160);

const sheetB = await figma.getNodeByIdAsync('402:9330');
sheetB.visible = true;
sheetB.topLeftRadius = 40;
sheetB.topRightRadius = 40;
sheetB.bottomLeftRadius = 0;
sheetB.bottomRightRadius = 0;
sheetB.resize(440, 836);

const ic = await figma.getNodeByIdAsync('402:9333');
if (ic && 'children' in ic && ic.children.length === 0) {
  $fig.get('402:9333').append(
    $fig.svg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3.5v13M3.5 10h13" stroke="#1C1C1E" stroke-width="1.8" stroke-linecap="round"/></svg>',
      { name: 'plus-glyph' },
    ),
  );
}

// --- 04d Step 2/21 ---
const pbD = await figma.getNodeByIdAsync('458:3822');
pbD.visible = false;
pbD.layoutPositioning = 'ABSOLUTE';
pbD.x = 0;
pbD.y = 0;

const heroD = await figma.getNodeByIdAsync('402:9388');
heroD.visible = true;

const sheetD = await figma.getNodeByIdAsync('402:9389');
sheetD.visible = true;
sheetD.topLeftRadius = 40;
sheetD.topRightRadius = 40;
sheetD.bottomLeftRadius = 0;
sheetD.bottomRightRadius = 0;

const body = await figma.getNodeByIdAsync('402:9409');
body.layoutSizingVertical = 'FILL';
body.primaryAxisAlignItems = 'CENTER';
body.counterAxisAlignItems = 'CENTER';
body.paddingTop = 0;
body.paddingBottom = 0;

const instr = await figma.getNodeByIdAsync('402:9410');
await figma.loadFontAsync(instr.fontName);
const t = instr.characters;
const beef = t.indexOf('beef');
const carrots = t.indexOf('carrots');
instr.setRangeFills(0, t.length, [{ type: 'SOLID', color: INK }]);
if (beef >= 0) instr.setRangeFills(beef, beef + 4, [{ type: 'SOLID', color: GREEN }]);
if (carrots >= 0) instr.setRangeFills(carrots, carrots + 7, [{ type: 'SOLID', color: GREEN }]);

const badge = await figma.getNodeByIdAsync('402:9405');
for (const c of badge.children) {
  if (c.type === 'TEXT') {
    await figma.loadFontAsync(c.fontName);
    c.characters = '2/21';
  }
}

const srcChrome = await figma.getNodeByIdAsync('406:14366');
const list = await figma.getNodeByIdAsync('402:9392');
const timer = await figma.getNodeByIdAsync('402:9398');
const voice = await figma.getNodeByIdAsync('402:9402');
const srcList = findNamed(srcChrome, 'List');
const srcTimer = findNamed(srcChrome, 'Timer');
let srcVoice = findNamed(srcChrome, 'Voice · default') || findNamed(srcChrome, 'Voice');
const iconReport = {
  list: await fillIfEmpty(list, srcList),
  timer: await fillIfEmpty(timer, srcTimer),
  voice: await fillIfEmpty(voice, srcVoice),
};

if (list && 'children' in list && list.children.length === 0) {
  $fig.get('402:9392').append(
    $fig.svg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="4.2" cy="7" r="3" stroke="#1C1C1E" stroke-width="1.4"/><path d="M2.7 7.05l1.25 1.25 2.35-2.55" stroke="#1C1C1E" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="9.2" y="6.2" width="10" height="1.6" rx="0.8" fill="#1C1C1E"/><circle cx="4.2" cy="15.2" r="3" stroke="#1C1C1E" stroke-width="1.4"/><rect x="9.2" y="14.4" width="10" height="1.6" rx="0.8" fill="#1C1C1E"/></svg>',
      { name: 'list-glyph' },
    ),
  );
}
if (timer && 'children' in timer && timer.children.length === 0) {
  $fig.get('402:9398').append(
    $fig.svg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="12" r="7.2" stroke="#00BD56" stroke-width="1.6"/><path d="M11 8.2v4.1l2.6 1.5" stroke="#00BD56" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.2 3.4h5.6" stroke="#00BD56" stroke-width="1.6" stroke-linecap="round"/></svg>',
      { name: 'timer-glyph' },
    ),
  );
}
if (voice && 'children' in voice && voice.children.length === 0) {
  $fig.get('402:9402').append(
    $fig.svg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="8" width="2.2" height="6" rx="1.1" fill="#1C1C1E"/><rect x="6.6" y="5.5" width="2.2" height="11" rx="1.1" fill="#1C1C1E"/><rect x="10.2" y="7" width="2.2" height="8" rx="1.1" fill="#1C1C1E"/><circle cx="16.4" cy="11" r="3.1" fill="#FF3B30"/><rect x="15.5" y="9.4" width="1.8" height="3.2" rx="0.9" fill="white"/></svg>',
      { name: 'voice-glyph' },
    ),
  );
}

const frameB = await figma.getNodeByIdAsync('402:9328');
const frameD = await figma.getNodeByIdAsync('402:9387');
frameB.x = 18128;
frameB.y = 168;
frameD.x = 19408;
frameD.y = 168;

return {
  iconReport,
  b: { x: frameB.x, y: frameB.y, w: frameB.width, h: frameB.height, kids: frameB.children.map((c) => ({ name: c.name, vis: c.visible, y: c.y, h: c.height })) },
  d: { x: frameD.x, y: frameD.y, w: frameD.width, h: frameD.height, kids: frameD.children.map((c) => ({ name: c.name, vis: c.visible, y: c.y, h: c.height })) },
};
