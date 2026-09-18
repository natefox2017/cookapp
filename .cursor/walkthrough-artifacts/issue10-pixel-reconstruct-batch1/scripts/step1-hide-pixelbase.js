/**
 * READY SCRIPT — paste into use_figma when quota returns.
 * Goal: reverse #85 wallpaper lock; restore constructed chrome.
 * skillNames: figma-use
 */
const PAGE_ID = '37:2';
const PB = {
  '43': '406:9087',
  '39': '406:9088',
  '05': '406:14356',
  '07': '406:14357',
};
const SOURCES = {
  '43': '116:19140',
  '39': '116:18996',
  '05': '116:8985',
  '07': '115:8375',
};

const page = figma.root.children.find((p) => p.id === PAGE_ID);
await figma.setCurrentPageAsync(page);

const report = { hiddenPB: [], restored: [], notes: [] };

for (const [pageKey, pbId] of Object.entries(PB)) {
  const pb = await figma.getNodeByIdAsync(pbId);
  if (pb && 'visible' in pb) {
    pb.visible = false;
    report.hiddenPB.push({ page: pageKey, id: pbId, name: pb.name });
  } else {
    report.notes.push(`missing PixelBase ${pageKey} ${pbId}`);
  }

  const src = await figma.getNodeByIdAsync(SOURCES[pageKey]);
  if (!src || !('children' in src)) continue;

  let restored = 0;
  for (const child of src.children) {
    if (child.id === pbId) continue;
    if ('visible' in child && child.visible === false) {
      // Only unhide likely chrome layers (not alternate states named Hidden/Alt)
      const n = child.name || '';
      if (/pixelbase|reference|wallpaper|docs.?fill/i.test(n)) continue;
      child.visible = true;
      restored += 1;
    }
  }
  report.restored.push({ page: pageKey, source: SOURCES[pageKey], restoredCount: restored });
}

return report;
