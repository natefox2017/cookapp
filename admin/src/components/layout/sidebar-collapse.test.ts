import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

describe('sidebar collapse chrome', () => {
  it('does not render a second floating collapse control on the rail', () => {
    const source = readFileSync(join(here, 'sidebar.tsx'), 'utf8')
    assert.equal(
      /ChevronsLeft|ChevronsRight/.test(source),
      false,
      'Sidebar rail must not duplicate the header collapse button',
    )
    assert.equal(
      /-right-3/.test(source),
      false,
      'Sidebar must not pin a floating collapse chip on the rail edge',
    )
  })

  it('keeps a single collapse control in the header', () => {
    const source = readFileSync(join(here, 'header.tsx'), 'utf8')
    assert.match(source, /Collapse sidebar/)
    assert.match(source, /PanelLeftClose|PanelLeftOpen/)
  })
})
