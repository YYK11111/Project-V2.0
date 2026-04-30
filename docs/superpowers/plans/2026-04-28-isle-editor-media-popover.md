# Isle Editor Media Bottom Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把图片、视频、附件块的交互从“块内 popover/footer”改造成“块本体 + 块下方悬浮浮层”，让浮层不再参与块体高度计算，并更接近 Notion 的媒体块操作感。

**Architecture:** 只修改 `media-block.js` 和对应测试，不碰业务页和上传协议。第一阶段使用相对块绝对定位方案：块本体作为定位锚点，浮层绝对定位到块下方；先解决“交互层级正确”问题，不引入 portal 或复杂碰撞系统。

**Tech Stack:** Vue 3 render function、现有 `MediaBlock` node view、Vitest、vue-test-utils、当前媒体上传适配层 `useIsleUpload.ts`

---

## File Structure

### Media block interaction files

- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`

### Media block tests

- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

## Task 1: Lock The Bottom-Popover Layout Contract With Tests

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

- [ ] **Step 1: Write the failing tests for “not in normal flow” popover behavior**

```ts
it('选中空块时渲染底部悬浮浮层容器', () => {
  const wrapper = createWrapper('image', {
    status: 'idle',
  }, {}, { selected: true })

  const popover = findPopover(wrapper)

  expect(popover.exists()).toBe(true)
  expect(popover.classes()).toContain('isle-editor-media-block__popover')
  expect(popover.text()).toContain('上传本地')
})

it('空块本体不再包含块内 footer/popover 行为入口', () => {
  const wrapper = createWrapper('image', {
    status: 'idle',
  }, {}, { selected: false })

  expect(wrapper.find('.isle-editor-media-block__content').exists()).toBe(false)
  expect(wrapper.find('.isle-editor-media-block__actions').exists()).toBe(false)
})
```

- [ ] **Step 2: Add a failing test that locks the new positioning class contract**

```ts
it('媒体块根节点为浮层定位提供锚点 class', () => {
  const wrapper = createWrapper('image', {
    status: 'done',
    src: '/upload/demo.png',
  }, {}, { selected: true })

  expect(wrapper.classes()).toContain('isle-editor-media-block--has-bottom-popover')
})
```

- [ ] **Step 3: Run test to verify the new contract fails**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: FAIL because current implementation still renders popover inside the body flow and does not expose a dedicated bottom-popover anchoring class

- [ ] **Step 4: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts
git commit -m "test: lock isle media bottom popover contract"
```

## Task 2: Move Popover Rendering Out Of The Block Body Flow

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

- [ ] **Step 1: Render popover as a sibling of the body instead of a child inside `__body`**

Keep this target shape:

```js
return h(NodeViewWrapper, { ... }, {
  default: () => [
    inputNode,
    h('div', { class: `${prefixClass}-media-block__body` }, [
      previewNode,
      contentNode,
    ]),
    renderSelectedPopover(),
    renderEmptyPopover(),
  ],
})
```

The popover must no longer be appended inside `__body`.

- [ ] **Step 2: Add a dedicated anchoring class to the block root when any popover is visible**

```js
const hasBottomPopover = computed(() => showSelectedPopover.value || showEmptyPopover.value)
```

```js
class: [
  `${prefixClass}-media-block`,
  `${prefixClass}-media-block--${type.value}`,
  {
    'is-selected': props.selected,
    'is-uploading': status.value === 'uploading',
    'is-error': status.value === 'error',
    'has-source': Boolean(urlValue.value),
    [`${prefixClass}-media-block--has-bottom-popover`]: hasBottomPopover.value,
  },
]
```

- [ ] **Step 3: Run media block tests to verify the structure contract passes**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: PASS for the new root-class and sibling-popover contract or fail only on the next missing layout behavior

- [ ] **Step 4: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts
git commit -m "feat: move isle media popover out of body flow"
```

## Task 3: Give The Popover A True Bottom-Floating Layout

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

- [ ] **Step 1: Add a failing source-level style test for absolute bottom positioning**

```ts
it('popover 使用绝对定位并位于块下方', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/features/isle-editor/components/media-block/media-block.js'), 'utf-8')

  expect(source).toContain("position: 'absolute'")
  expect(source).toContain("top: 'calc(100% + 8px)'")
  expect(source).toContain("left: '0'")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: FAIL because current popover has no explicit floating layout contract

- [ ] **Step 3: Add minimal floating style to the popover container**

```js
function getPopoverStyle() {
  return {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: '0',
    zIndex: '3',
  }
}
```

```js
return h('div', {
  class: `${prefixClass}-media-block__popover`,
  style: getPopoverStyle(),
}, [...])
```

- [ ] **Step 4: Keep the popover visually separate from the block body**

At minimum, set a container class that lets it behave like a floating layer instead of a footer. Do not reintroduce it into the normal content column.

- [ ] **Step 5: Run media block tests again to verify the floating contract passes**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts
git commit -m "feat: position isle media popover below block"
```

## Task 4: Keep Empty, Link, Completed, And Error States On The Same Floating Layer

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

- [ ] **Step 1: Write the failing tests for state continuity on the same bottom popover layer**

```ts
it('通过链接后仍然使用同一个底部浮层容器', async () => {
  const wrapper = createWrapper('attachment', {
    status: 'idle',
  }, {}, { selected: true })

  await wrapper.findAll('button').find((button) => button.text().includes('通过链接'))?.trigger('click')

  const popover = findPopover(wrapper)

  expect(popover.exists()).toBe(true)
  expect(popover.find('.isle-editor-media-block__url-input').exists()).toBe(true)
})

it('错误态块选中后底部浮层只显示重试上传和删除', () => {
  const wrapper = createWrapper('attachment', {
    status: 'error',
    error: '上传失败',
    name: 'broken.pdf',
  }, {}, { selected: true })

  const popover = findPopover(wrapper)

  expect(popover.text()).toContain('重试上传')
  expect(popover.text()).toContain('删除')
  expect(popover.text()).not.toContain('打开')
})
```

- [ ] **Step 2: Run test to verify state continuity fails if the popover logic regresses**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: FAIL if any state still leaks actions back into the block body or a different container

- [ ] **Step 3: Keep all state variants rendering through the same absolute popover container**

Maintain one container contract:

```js
renderEmptyPopover()
renderSelectedPopover()
```

Both functions should return the same `__popover` container class and the same bottom-floating style factory.

- [ ] **Step 4: Run tests to verify empty, link, completed, and error states all stay on the bottom popover layer**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts
git commit -m "feat: unify bottom popover states for isle media blocks"
```

## Task 5: Verify Bottom-Popover Behavior And Existing Regressions

**Files:**
- Verify only: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`

- [ ] **Step 1: Run media block interaction tests**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: PASS

- [ ] **Step 2: Run viewer and nodeview regression tests**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts src/features/isle-editor/components/isleArticleEditor.media-nodeview.spec.ts`
Expected: PASS

- [ ] **Step 3: Run frontend type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit final verified state**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts docs/superpowers/specs/2026-04-28-isle-editor-media-popover-design.md docs/superpowers/plans/2026-04-28-isle-editor-media-popover.md
git commit -m "feat: float isle media popovers below blocks"
```

## Self-Review

- Spec coverage checked: empty selected popover, bottom-floating positioning, in-popover link input, completed-state popover, and error-state recovery all map to explicit tasks.
- Placeholder scan checked: no `TODO`, `TBD`, “similar to above”, or vague “make it more like Notion” instructions remain.
- Type consistency checked: state names and action labels stay aligned with the current `MediaBlock` responsibilities and do not introduce business-page dependencies.
