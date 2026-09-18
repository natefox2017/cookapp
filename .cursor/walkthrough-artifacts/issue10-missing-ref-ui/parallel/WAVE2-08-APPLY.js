// MENU-08 · use_figma · skillNames: figma-use · fileKey FHbikS2jILAeMv8mote0vD
// Frames (do NOT change x/y): 374:13328 / 13410 / 13502 / 13768 / 13837
// Never edit 77:237 or 127:10295. Never resetOverrides / createImageAsync / get_design_context.
const page = figma.root.children.find((p) => p.name === 'Cookapp · Recording Reproduction');
await figma.setCurrentPageAsync(page);

const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};

const WHITE = hex('#ffffff');
const INK = hex('#1c1c1e');
const HAIR = { type: 'SOLID', color: hex('#000000'), opacity: 0.1 };

const glassFill = [{ type: 'SOLID', color: WHITE, opacity: 0.55 }];
const glassStroke = [{ type: 'SOLID', color: WHITE, opacity: 0.42 }];
const glassFx = [
  { type: 'BACKGROUND_BLUR', radius: 48, visible: true },
  {
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.14 },
    offset: { x: 0, y: 10 },
    radius: 28,
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  },
];

function ensureMask(parentId, name) {
  const existing = $fig.query(`FRAME[id="${parentId}"] > RECTANGLE[name="${name}"]`);
  if (existing.length) {
    existing.set({ visible: true, fills: [{ type: 'SOLID', color: WHITE }] });
    return;
  }
  $fig.get(parentId).append(
    $fig.rectangle({
      name,
      x: 0,
      y: 176,
      width: 440,
      height: 700,
      fills: [{ type: 'SOLID', color: WHITE }],
    }),
  );
}

function glassify(id) {
  $fig.get(id).set({
    fills: glassFill,
    strokes: glassStroke,
    strokeWeight: 0.75,
    cornerRadius: 16,
    effects: glassFx,
    visible: true,
  });
}

function circleSearchIfSquare(frameId) {
  const hits = $fig.query(
    `FRAME[id="${frameId}"] INSTANCE, FRAME[id="${frameId}"] FRAME[name*=Search], FRAME[id="${frameId}"] ELLIPSE[name*=Search]`,
  );
  // Overlay a 60pt circle at screenshot search slot if a square control is a sibling (not NAV set).
  const squares = $fig.query(`FRAME[id="${frameId}"] > RECTANGLE[name*=Search], FRAME[id="${frameId}"] > FRAME[name*=Search]`);
  if (!squares.length) return { searchOverlay: false, hits: hits.length };
  squares.each((n) => {
    if ('cornerRadius' in n) n.cornerRadius = Math.min(n.width, n.height) / 2;
    if (n.width !== n.height && 'resize' in n) n.resize(60, 60);
  });
  return { searchOverlay: 'rounded-existing', hits: hits.length };
}

// --- hide PixelBase, unhide vector ---
$fig.get('458:3823').set({ visible: false });
$fig.get('374:13329').set({ visible: true });
$fig.get('374:13390').set({ visible: true });

$fig.get('458:3824').set({ visible: false });
$fig.get('374:13411').set({ visible: true });
$fig.get('374:13472').set({ visible: true });
$fig.get('538:6554').set({ visible: false });

$fig.get('458:3825').set({ visible: false });
$fig.get('374:13503').set({ visible: true });
$fig.get('374:13564').set({ visible: true });

$fig.get('458:3826').set({ visible: false });
$fig.get('374:13769').set({ visible: true });
$fig.get('374:13830').set({ visible: false });
$fig.get('374:13831').set({ visible: true });

$fig.get('458:3827').set({ visible: false });
$fig.get('374:13838').set({ visible: true });
$fig.get('374:13899').set({ visible: false });
$fig.get('374:13900').set({ visible: true });
$fig.get('374:13902').set({ visible: true });

// List / Photo List: hide grid tile from 08 base without editing the instance internals
ensureMask('374:13768', 'ContentMask');
ensureMask('374:13837', 'ContentMask');

glassify('374:13564');

const search = {
  '08b': circleSearchIfSquare('374:13328'),
  '08c': circleSearchIfSquare('374:13410'),
  '08f': circleSearchIfSquare('374:13502'),
  '08d': circleSearchIfSquare('374:13768'),
  '08e': circleSearchIfSquare('374:13837'),
};

$fig.get('374:13328').screenshot({ scale: 1 });
$fig.get('374:13410').screenshot({ scale: 1 });
$fig.get('374:13502').screenshot({ scale: 1 });
$fig.get('374:13768').screenshot({ scale: 1 });
$fig.get('374:13837').screenshot({ scale: 1 });

return {
  pixelBaseHidden: ['458:3823', '458:3824', '458:3825', '458:3826', '458:3827'],
  framesUnmoved: true,
  search,
  ink: INK,
  hair: HAIR,
};
