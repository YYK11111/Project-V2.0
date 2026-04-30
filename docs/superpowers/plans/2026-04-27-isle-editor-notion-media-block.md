# Isle Editor Notion Media Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让知识中心 `IsleArticleEditor` 的图片、视频、附件块具备 Notion 风格的原位块卡片体验，支持本地上传为主、链接插入为辅，并打通上传、失败、重试、替换、删除和查看态回显。

**Architecture:** 保留现有 `image`、`video`、`attachment` 节点和统一 `media-block.js` 结构，不拆三套组件。入口层只负责插入空块，块内负责本地上传、链接输入、状态流和动作区，`useIsleUpload.ts` 继续承担上传适配，`IsleArticleViewer.vue` 保持只读卡片展示。

**Tech Stack:** Vue 3、TipTap 2、`nest-admin-frontend/src/features/isle-editor/**`、Vitest、vue-test-utils、`vue-tsc`

---

## File Structure

### Runtime node schema and insertion commands

- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/image.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/video.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/attachment.js`
- Test: `nest-admin-frontend/src/features/isle-editor/core/extensions/media-node.spec.ts`

### Media block UI and state flow

- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`
- Test: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

### Upload adapter normalization

- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts`

### Read-only viewer consistency

- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`

## Task 1: Convert Media Commands To Insert Empty Blocks

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/image.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/video.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/attachment.js`
- Test: `nest-admin-frontend/src/features/isle-editor/core/extensions/media-node.spec.ts`

- [ ] **Step 1: Write the failing schema test for empty media block insertion**

```ts
it('slash commands insert empty media blocks with idle status by default', () => {
  const editor = new Editor({
    extensions: [DocumentExtension, ParagraphExtension, Text, ImageExtension, VideoExtension, AttachmentExtension],
    content: '<p>before</p>',
  })

  ImageExtension.options.command({ editor, params: {} })
  VideoExtension.options.command({ editor, params: {} })
  AttachmentExtension.options.command({ editor, params: {} })

  const mediaNodes = editor.getJSON().content?.filter((node) => ['image', 'video', 'attachment'].includes(node.type))

  expect(mediaNodes).toEqual([
    {
      type: 'image',
      attrs: {
        src: '',
        alt: '',
        title: '',
        name: '',
        size: 0,
        mime: '',
        width: '',
        status: 'idle',
        error: '',
      },
    },
    {
      type: 'video',
      attrs: {
        src: '',
        poster: '',
        title: '',
        name: '',
        size: 0,
        mime: '',
        width: '',
        status: 'idle',
        error: '',
      },
    },
    {
      type: 'attachment',
      attrs: {
        url: '',
        title: '',
        name: '',
        size: 0,
        mime: '',
        ext: '',
        status: 'idle',
        error: '',
      },
    },
  ])

  editor.destroy()
})
```

- [ ] **Step 2: Run test to verify current command contract fails the new expectation**

Run: `npm run test:unit -- src/features/isle-editor/core/extensions/media-node.spec.ts`
Expected: FAIL because existing assertions and command usage are still centered on pre-filled attrs instead of explicit empty block insertion coverage

- [ ] **Step 3: Make media command defaults explicit in node extensions**

```js
const attrs = {
  src: params.src || '',
  alt: params.alt || '',
  title: params.title || '',
  name: params.name || '',
  size: params.size || 0,
  mime: params.mime || '',
  width: params.width || '',
  status: params.status || 'idle',
  error: params.error || '',
}
```

For `video.js` keep `poster`, and for `attachment.js` keep `url` + `ext` with the same empty defaults.

- [ ] **Step 4: Update the schema test to cover both empty insertion and populated attrs**

```ts
expect(typeof ImageExtension.options.command).toBe('function')
expect(typeof VideoExtension.options.command).toBe('function')
expect(typeof AttachmentExtension.options.command).toBe('function')
```

Keep the existing populated-payload assertions in the same file so the commands still support later block updates with real attrs.

- [ ] **Step 5: Run test to verify schema and empty insertion behavior pass**

Run: `npm run test:unit -- src/features/isle-editor/core/extensions/media-node.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/core/extensions/image.js nest-admin-frontend/src/features/isle-editor/core/extensions/video.js nest-admin-frontend/src/features/isle-editor/core/extensions/attachment.js nest-admin-frontend/src/features/isle-editor/core/extensions/media-node.spec.ts
git commit -m "feat: insert empty isle media blocks"
```

## Task 2: Rebuild `media-block.js` Around Empty-State First UX

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`
- Test: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

- [ ] **Step 1: Write the failing UI tests for empty-state CTA and in-block URL toggle**

```ts
it('空媒体块优先展示本地上传和链接插入入口', () => {
  const wrapper = createWrapper('image', { status: 'idle' })

  expect(wrapper.text()).toContain('上传本地文件')
  expect(wrapper.text()).toContain('通过链接插入')
  expect(wrapper.find('.isle-editor-media-block__url-box').exists()).toBe(false)
})

it('点击通过链接插入后才展开 URL 输入区', async () => {
  const wrapper = createWrapper('attachment', { status: 'idle' })

  await wrapper.findAll('button').find((button) => button.text().includes('通过链接插入'))?.trigger('click')

  expect(wrapper.find('.isle-editor-media-block__url-box').exists()).toBe(true)
})
```

- [ ] **Step 2: Run test to verify current block UI fails the new empty-state expectation**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: FAIL because current block always renders the URL input box and does not expose Notion-style empty-state CTAs

- [ ] **Step 3: Add explicit block-local UI state for URL mode**

```js
const isUrlMode = ref(false)

function openUrlMode() {
  if (isUploading.value) return
  isUrlMode.value = true
}

function closeUrlMode() {
  urlInput.value = ''
  isUrlMode.value = false
}
```

- [ ] **Step 4: Split rendering into empty, uploading, completed, and error-aware sections**

```js
function renderEmptyActions() {
  return h('div', { class: `${prefixClass}-media-block__empty-actions` }, [
    h(IButton, { onClick: openPicker }, {
      icon: () => h(IIcon, { name: 'upload', size: 13 }),
      default: () => h('span', '上传本地文件'),
    }),
    h(IButton, { onClick: openUrlMode }, {
      icon: () => h(IIcon, { name: 'link', size: 13 }),
      default: () => h('span', '通过链接插入'),
    }),
  ])
}
```

Render `renderEmptyActions()` when there is no source and `isUrlMode` is false. Only render the URL box after the secondary CTA is clicked.

- [ ] **Step 5: Keep URL confirmation in-place and close URL mode after success**

```js
async function submitUrl() {
  const value = urlInput.value.trim()
  if (!value) return

  isSubmittingUrl.value = true
  props.updateAttributes({
    [typeConfig.value.urlKey]: value,
    ...createUrlReplaceAttrs(type.value, value),
  })
  closeUrlMode()
  isSubmittingUrl.value = false
}
```

- [ ] **Step 6: Run tests to verify empty-state UX now matches the plan**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: PASS for the new CTA and URL toggle cases, or fail only on the next missing behavior

- [ ] **Step 7: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts
git commit -m "feat: add empty state for isle media blocks"
```

## Task 3: Make Local Upload, Retry, and Replace Work In-Place

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`
- Test: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

- [ ] **Step 1: Add failing tests for upload state flow and in-place retry**

```ts
it('本地文件上传时先进入 uploading 再进入 done', async () => {
  const uploadImage = vi.fn(async () => ({ src: '/upload/article/demo.png', status: 'done' }))
  const wrapper = createWrapper('image', { status: 'idle' }, { uploadImage })
  const file = new File(['img'], 'demo.png', { type: 'image/png' })

  await triggerFileSelect(wrapper, file)

  const updateCalls = wrapper.props('updateAttributes').mock.calls
  expect(updateCalls[0]?.[0]).toMatchObject({
    name: 'demo.png',
    mime: 'image/png',
    status: 'uploading',
  })
  expect(updateCalls.at(-1)?.[0]).toMatchObject({
    src: '/upload/article/demo.png',
    status: 'done',
  })
})
```

```ts
it('失败态下继续点击上传会复用原块重试', async () => {
  const uploadVideo = vi.fn()
    .mockRejectedValueOnce(new Error('首次失败'))
    .mockResolvedValueOnce({ src: '/upload/demo.mp4', status: 'done' })
  const wrapper = createWrapper('video', { status: 'idle' }, { uploadVideo })
  const file = new File(['video'], 'demo.mp4', { type: 'video/mp4' })

  await triggerFileSelect(wrapper, file)
  await triggerFileSelect(wrapper, file)

  expect(wrapper.props('updateAttributes').mock.calls.at(-1)?.[0]).toMatchObject({
    src: '/upload/demo.mp4',
    status: 'done',
  })
})
```

- [ ] **Step 2: Run test to verify upload and retry coverage fails before the state flow is tightened**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: FAIL on the new upload-state assertions

- [ ] **Step 3: Consolidate upload state updates in `uploadFile`**

```js
const baseAttrs = {
  name: file.name,
  title: file.name,
  size: file.size,
  mime: file.type,
  status: 'uploading',
  error: '',
}
```

For attachments add `ext: getFileExtension(file.name)`. Use the same `uploadFile` entry for initial upload, retry, and replace.

- [ ] **Step 4: Make replace reuse the same hidden file input path**

```js
function openPicker() {
  if (isUploading.value) return
  inputRef.value?.click()
}
```

Keep `openPicker()` bound to both the empty-state primary CTA and the completed-state `替换` action so replace is not a separate code path.

- [ ] **Step 5: Keep failed blocks recoverable without rebuilding nodes**

```js
props.updateAttributes({
  status: 'error',
  error: uploadError instanceof Error ? uploadError.message : t('uploadFailed'),
})
```

Do not clear `name`, `mime`, `size`, or existing source fields on failure.

- [ ] **Step 6: Run tests to verify local upload, retry, and replace all stay in-place**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts
git commit -m "feat: support in-place upload retry for isle media blocks"
```

## Task 4: Normalize Upload Adapter Payloads For Stable Media Metadata

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts`

- [ ] **Step 1: Add failing adapter tests for metadata completeness**

```ts
it('attachment upload keeps ext and normalizes returned url', async () => {
  uploadMock.mockResolvedValue({
    code: 200,
    data: { url: 'docs/spec.pdf' },
  })

  const adapter = useIsleUpload()
  await expect(adapter.uploadAttachment(new File(['pdf'], 'spec.pdf', { type: 'application/pdf' }))).resolves.toEqual({
    url: '/upload/docs/spec.pdf',
    name: 'spec.pdf',
    type: 'attachment',
  })
})
```

```ts
it('image and video uploads preserve normalized src', async () => {
  uploadMock.mockResolvedValueOnce({ code: 200, data: { url: 'article/demo.png' } })
  uploadMock.mockResolvedValueOnce({ code: 200, data: { url: 'media/demo.mp4' } })

  const adapter = useIsleUpload()
  await expect(adapter.uploadImage(new File(['img'], 'demo.png', { type: 'image/png' }))).resolves.toMatchObject({ src: '/upload/article/demo.png' })
  await expect(adapter.uploadVideo(new File(['video'], 'demo.mp4', { type: 'video/mp4' }))).resolves.toMatchObject({ src: '/upload/media/demo.mp4' })
})
```

- [ ] **Step 2: Run adapter tests to verify the current contract is explicitly covered**

Run: `npm run test:unit -- src/features/isle-editor/adapters/useIsleUpload.spec.ts`
Expected: FAIL if metadata normalization is incomplete or insufficiently asserted

- [ ] **Step 3: Keep adapter return payloads minimal but stable**

```ts
if (type === 'attachment') {
  return {
    url: normalizedUrl,
    name: file.name,
    type,
  }
}

return {
  src: normalizedUrl,
  name: file.name,
  type,
}
```

Do not move `size`, `mime`, or `ext` into the adapter contract unless required; those already come from the local `File` object and are merged in `media-block.js`.

- [ ] **Step 4: Keep URL normalization behavior covered for `/upload/`, `/static/`, and bare paths**

```ts
expect(normalizeUploadUrl('upload/demo.png')).toBe('/upload/demo.png')
expect(normalizeUploadUrl('static/book.png')).toBe('/static/book.png')
expect(normalizeUploadUrl('docs/spec.pdf')).toBe('/upload/docs/spec.pdf')
```

If `normalizeUploadUrl` remains private, cover these cases through `uploadMock` response inputs in the spec instead of exporting the helper.

- [ ] **Step 5: Run adapter tests to verify payloads match the media block merge logic**

Run: `npm run test:unit -- src/features/isle-editor/adapters/useIsleUpload.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts
git commit -m "test: lock isle upload adapter payloads"
```

## Task 5: Polish Completed-State Actions And Viewer Consistency

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

- [ ] **Step 1: Add failing tests for completed-state action labels and attachment card persistence**

```ts
it('完成态图片块展示替换、打开、复制链接、删除动作', () => {
  const wrapper = createWrapper('image', {
    src: '/upload/demo.png',
    name: 'demo.png',
    status: 'done',
  })

  expect(wrapper.text()).toContain('替换')
  expect(wrapper.text()).toContain('打开')
  expect(wrapper.text()).toContain('复制链接')
  expect(wrapper.text()).toContain('删除')
})
```

```ts
it('附件查看态保持卡片容器而不是裸文本链接', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp({
    render() {
      return h(IsleArticleViewer, {
        content: {
          type: 'doc',
          content: [{ type: 'attachment', attrs: { url: '/upload/manual.pdf', name: 'manual.pdf' } }],
        },
      })
    },
  })

  app.mount(container)
  await nextTick()

  expect(container.querySelector('[data-node-type="attachment"]')).not.toBeNull()
  expect(container.querySelector('[data-node-type="attachment"] a')?.textContent).toContain('manual.pdf')

  app.unmount()
  container.remove()
})
```

- [ ] **Step 2: Run tests to verify completed-state behavior is fully asserted**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: FAIL on the new action wording or viewer-structure assertions

- [ ] **Step 3: Update media block completed-state actions to match the design**

```js
function renderActions() {
  return h('div', { class: `${prefixClass}-media-block__actions` }, [
    h(IButton, { onClick: openPicker, disabled: isUploading.value }, { default: () => h('span', '替换') }),
    h(IButton, { onClick: openSource, disabled: !canOpenSource.value }, { default: () => h('span', '打开') }),
    type.value !== 'video'
      ? h(IButton, { onClick: copySource, disabled: !canOpenSource.value }, { default: () => h('span', '复制链接') })
      : null,
    h(IButton, { onClick: removeBlock, danger: true }, { default: () => h('span', '删除') }),
  ])
}
```

Implement `copySource()` with `navigator.clipboard?.writeText(urlValue.value)` guard. On unsupported environments, do nothing but keep the button disabled when there is no source.

- [ ] **Step 4: Keep viewer attachment rendering card-like and stable**

```vue
<div data-node-type="attachment" class="isle-editor-attachment-card">
  <a :href="url" target="_blank" rel="noopener noreferrer nofollow">{{ name || url }}</a>
</div>
```

Do not collapse attachment rendering to a bare anchor; preserve the wrapping card container and current media block semantics.

- [ ] **Step 5: Run tests to verify completed-state actions and viewer consistency pass**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts
git commit -m "feat: polish isle media block completed state"
```

## Task 6: Run Targeted Verification And Frontend Type Check

**Files:**
- Verify only: `nest-admin-frontend/src/features/isle-editor/**`

- [ ] **Step 1: Run media node schema test**

Run: `npm run test:unit -- src/features/isle-editor/core/extensions/media-node.spec.ts`
Expected: PASS

- [ ] **Step 2: Run media block UI test**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: PASS

- [ ] **Step 3: Run viewer test**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: PASS

- [ ] **Step 4: Run upload adapter test**

Run: `npm run test:unit -- src/features/isle-editor/adapters/useIsleUpload.spec.ts`
Expected: PASS

- [ ] **Step 5: Run frontend type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 6: Commit verification-safe final state**

```bash
git add nest-admin-frontend/src/features/isle-editor docs/superpowers/specs/2026-04-27-isle-editor-notion-media-block-design.md docs/superpowers/plans/2026-04-27-isle-editor-notion-media-block.md
git commit -m "feat: complete notion style isle media blocks"
```

## Self-Review

- Spec coverage checked: empty block insertion, local upload primary path, URL secondary path, in-place retry/replace, viewer card persistence, and targeted tests all map to tasks above.
- Placeholder scan checked: no `TODO`, `TBD`, or vague “add tests later” instructions remain.
- Type consistency checked: `src`, `url`, `status`, `error`, `poster`, and `ext` property names stay consistent with current node schemas and tests.
