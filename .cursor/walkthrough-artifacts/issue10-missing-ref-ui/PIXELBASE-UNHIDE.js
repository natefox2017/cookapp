// Paste into use_figma when Education quota recovers.
// Hides PixelBase on claimed sources and unhides sibling chrome.
// fileKey FHbikS2jILAeMv8mote0vD page 37:2
const page = figma.root.children.find(p => p.id === '37:2');
await figma.setCurrentPageAsync(page);
const srcIds = [
  '116:8936','116:8908','118:11283','118:11342','184:13290','118:10902',
  '118:10814','118:10840','118:10871','115:8329','216:16333','115:8090',
  '118:11228','118:11826','118:11949','115:7966','118:10756','118:11059',
  '118:11143','116:18900','116:18924','116:18972','116:19044','116:19116',
  '116:19188','116:19212','196:27884','116:19356'
];
const report = [];
for (const id of srcIds) {
  const src = await figma.getNodeByIdAsync(id);
  if (!src || !('children' in src)) { report.push({ id, missing: true }); continue; }
  let hid = 0, shown = 0;
  for (const c of src.children) {
    if (c.name === 'PixelBase' && c.visible) { c.visible = false; hid++; }
    else if (c.name !== 'PixelBase' && !c.visible) { c.visible = true; shown++; }
  }
  report.push({
    id,
    name: src.name,
    hid,
    shown,
    vis: src.children.filter(c => c.visible).map(c => c.name).slice(0, 16),
  });
}
return report;
