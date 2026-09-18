// use_figma · skillNames: figma-use · fileKey FHbikS2jILAeMv8mote0vD
// GROC-B only: 28 118:10756 · 28b 395:9193 · 28c 395:9302
// NEVER edit 77:237 or 127:10295. Never resetOverrides. Never createImageAsync.
const page = figma.root.children.find((p) => p.name === 'Cookapp · Recording Reproduction');
await figma.setCurrentPageAsync(page);

const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};
const green = hex('#00BD56');
const hair = { type: 'SOLID', color: hex('#FFFFFF'), opacity: 0.55 };
const glassFill = { type: 'SOLID', color: hex('#FFFFFF'), opacity: 0.72 };
const glassFx = [
  { type: 'BACKGROUND_BLUR', radius: 28, visible: true },
  { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.14 }, offset: { x: 0, y: 8 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' },
];
const circleFx = [
  { type: 'BACKGROUND_BLUR', radius: 20, visible: true },
  { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 1 }, radius: 6, spread: 0, visible: true, blendMode: 'NORMAL' },
];
const circleFill = { type: 'SOLID', color: hex('#FFFFFF'), opacity: 0.62 };
const circleStroke = { type: 'SOLID', color: hex('#FFFFFF'), opacity: 0.5 };

function deepShow(id) {
  const root = figma.getNodeById(id);
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    n.visible = true;
    if ('children' in n) for (const c of n.children) stack.push(c);
  }
}

$fig.get('423:3837').set({ visible: false });
$fig.get('524:9668').set({ visible: false });
$fig.get('524:9669').set({ visible: false });
$fig.get('395:9161').set({ visible: true });
$fig.get('395:9194').set({ visible: true });
$fig.get('395:9303').set({ visible: true });
await $fig.done();

deepShow('395:9161');
deepShow('395:9194');
deepShow('395:9303');

['395:9312', '395:9315', '395:9324', '395:9328', '395:9332', '395:9336', '447:3822'].forEach((id) => {
  const n = figma.getNodeById(id);
  if (n) n.visible = false;
});

['395:9163', '395:9167', '395:9305'].forEach((id) => {
  $fig.get(id).set({
    fills: [circleFill],
    strokes: [circleStroke],
    strokeWeight: 0.5,
    effects: circleFx,
  });
});

$fig.get('395:9195').set({ visible: true, opacity: 1 });
$fig.get('395:9290').set({ visible: true, fills: [{ type: 'SOLID', color: hex('#3A3A3C'), opacity: 0.28 }] });
$fig.get('395:9291').set({
  fills: [glassFill],
  strokes: [hair],
  strokeWeight: 0.5,
  effects: glassFx,
  cornerRadius: 28,
});
$fig.get('395:9298').set({ layoutSizingHorizontal: 'FILL', fills: [{ type: 'SOLID', color: hex('#E5E5EA'), opacity: 0.92 }] });
$fig.get('395:9300').set({ layoutSizingHorizontal: 'FILL', fills: [{ type: 'SOLID', color: green, opacity: 1 }] });
$fig.get('395:9294').set({ fills: [{ type: 'SOLID', color: hex('#E8E8ED'), opacity: 0.95 }] });

$fig.get('395:9302').set({ fills: [{ type: 'SOLID', color: hex('#AEAEB2'), opacity: 1 }] });
$fig.get('395:9303').set({
  fills: [{ type: 'SOLID', color: hex('#FFFFFF'), opacity: 1 }],
  strokes: [{ type: 'SOLID', color: hex('#FFFFFF'), opacity: 0.4 }],
  strokeWeight: 0.5,
  effects: [
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.16 }, offset: { x: 0, y: -4 }, radius: 28, spread: 0, visible: true, blendMode: 'NORMAL' },
  ],
});
const sheet = figma.getNodeById('395:9303');
sheet.topLeftRadius = 40;
sheet.topRightRadius = 40;
sheet.bottomLeftRadius = 0;
sheet.bottomRightRadius = 0;
sheet.x = 0;
sheet.y = 10;
sheet.resize(440, 946);

$fig.get('395:9321').set({
  fills: [{ type: 'SOLID', color: hex('#F2F2F7'), opacity: 0.82 }],
  strokes: [hair],
  strokeWeight: 0.5,
  cornerRadius: 16,
  effects: [
    { type: 'BACKGROUND_BLUR', radius: 24, visible: true },
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.18 }, offset: { x: 0, y: 10 }, radius: 28, spread: 0, visible: true, blendMode: 'NORMAL' },
  ],
});
$fig.get('395:9337').set({
  fills: [{ type: 'SOLID', color: hex('#FFFFFF'), opacity: 0.92 }],
  strokes: [{ type: 'SOLID', color: hex('#E5E5EA'), opacity: 1 }],
  strokeWeight: 0.5,
  cornerRadius: 16,
});
$fig.get('395:9342').set({
  fills: [{ type: 'SOLID', color: hex('#F7F7F8'), opacity: 1 }],
  cornerRadius: 18,
});

await $fig.done();

return {
  pixel: {
    '28': figma.getNodeById('423:3837').visible,
    '28b': figma.getNodeById('524:9668').visible,
    '28c': figma.getNodeById('524:9669').visible,
  },
  vec: {
    '28': figma.getNodeById('395:9161').visible,
    '28b': figma.getNodeById('395:9194').visible,
    '28c': figma.getNodeById('395:9303').visible,
  },
  cta: {
    cancelW: figma.getNodeById('395:9298').width,
    createW: figma.getNodeById('395:9300').width,
  },
  tree: {
    '28': { x: figma.getNodeById('119:12120').x, y: figma.getNodeById('119:12120').y },
    '28b': { x: figma.getNodeById('395:9346').x, y: figma.getNodeById('395:9346').y },
    '28c': { x: figma.getNodeById('395:9455').x, y: figma.getNodeById('395:9455').y },
  },
};
