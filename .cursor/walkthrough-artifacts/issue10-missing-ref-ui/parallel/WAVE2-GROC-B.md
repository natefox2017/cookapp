# WAVE2-GROC-B — 28 New Item · 28b Create Shopping List · 28c Share List

Agent: **GROC-B** (implementer). File `FHbikS2jILAeMv8mote0vD`. Page `Cookapp · Recording Reproduction` (`37:2`). Tree `113:7937`.  
`skillNames: "figma-use"`. **No** `get_design_context`. **No** `resetOverrides()`. **No** `createImageAsync`. **No** edits to Bottom NAV `77:237` or header set `127:10295`. Tree instances **not** moved (`119:12120` x=2768, `395:9346` x=3408, `395:9455` x=4048, all y=4977).

Stills (ignore status bar / Dynamic Island / keyboard):

| Page | Still | Instance | SOURCE | PixelBase |
|------|-------|----------|--------|-----------|
| **28** New Item | `docs/ui-screenshots/missing-ref/24-28/IMG_4462.PNG` | `119:12120` | `118:10756` | `423:3837` **hidden** |
| **28b** Create Shopping List | `docs/ui-screenshots/missing-ref/24-28/IMG_4460.PNG` | `395:9346` | `395:9193` | `524:9668` **hidden** |
| **28c** Share List | `docs/ui-screenshots/missing-ref/24-28/IMG_4461.PNG` | `395:9455` | `395:9302` | `524:9669` **hidden** |

## Applied on SOURCE (vector, not PixelBase)

Existing hidden reconstructions were turned on and glass/CTA-fixed. Re-runnable copy: `WAVE2-GROC-B-APPLY.js`.

### 28 `395:9161` Pantry New Item — **visible** (header `395:9162` visible)

Light page. Glass 48pt pencil / close circles. Centered **Pantry**. White search **noq** + green info. Green **New item** / **Scan barcode** + helper copy. No tab bar. No keyboard.

### 28b `395:9194` Stage — **visible**

Groceries-behind instance `395:9195` of `115:8136` **visible**. Scrim. Glass dialog `395:9291` (blur + hairline + shadow). Field **Groceries** + green caret. **Cancel** / **Create** equal FILL pills (measured **128.5** each). Keyboard omitted.

### 28c `395:9303` Share List Sheet — **visible**

SOURCE dim fill. Sheet y=10, h=946, top radius 40. Glass close circle. Title **Share List**, steps 1–3, app glyphs, glass context menu, Shopping List row, Collaborate card. Placeholder emoji layers stay hidden.

## Post-apply probe

```
pixel: [false, false, false]
pantryHeader: true
cancelW: 128.5  createW: 128.5
groc: true
sheetY: 10
tree x: [2768, 3408, 4048]
```

`get_screenshot` of the three instances was blocked by Education MCP daily quota after the writes. QA should screenshot `119:12120`, `395:9346`, `395:9455`.

## Not touched

- `77:237`, `127:10295`
- Other Interaction Tree children
- Groceries SOURCE `115:8136` (backdrop instance only)
- Keyboard / status bar / Dynamic Island
