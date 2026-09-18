# WAVE6 — extra Tab bars + top inset audit

Did not edit `77:237` / `127:10295`. Status bar still not drawn.

## Tab bar

**Kept** (root tabs or overlay on a tab root): 01 Cookbook, 07 Folders, 08/09, 11 Discover, 20/23, 24 empty Groceries, 25–27, 28b backdrop, 03, 30, 31/32 add menus, 08b–f backdrop.

**Changed**
- **02** long detail: tab was at y=3798 (looked like a stray bar on the tall frame) → **y=876** (first viewport).
- **29** long meal plan: tab y=1658 → **y=876**.
- **06** Recipe Menu: hid extra Bottom Chrome `607:8654` (nested 02 already supplies one tab at 876).

Settings 33–46, search 16–19, 10, 12–15, 28, 41–45, cooking/timer already had **no** tab.

## Top buttons vs status-bar inset

Moved **header y=54/60 → 0** (buttons in the set stay TOP=16):

- 24 empty Groceries `128:24884` + Pantry `196:24760` (16,16)
- 31 Add Menu `373:7939`
- 32 Add Section `374:7855`
- 19 Scope Filter `246:6756`
- 05 Timer Back `314:13912` (16,16)
- 10 extra Date Added Cancel/Confirm (16 / 376, y=16)

**07 Folders Trailing y=2** is inside the header instance (locked). Not edited `127:10295`.
