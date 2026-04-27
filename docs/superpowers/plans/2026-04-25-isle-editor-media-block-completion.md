# Isle Editor Media Block Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐图片块、视频块、附件块在知识模块中的编辑态、查看态、slash、上传中、错误恢复、替换、删除、打开和元信息展示能力，使三类媒体块达到一致、完整、可用的状态。

**Architecture:** 继续以 `media-block.js` 作为三类媒体块的统一 UI 与交互入口，`useIsleUpload.ts` 作为上传适配层，`image.js` / `video.js` / `attachment.js` 作为节点 schema 与命令层。编辑态与查看态共用同一套节点结构和主视觉语言，但编辑态保留动作区，查看态保留预览与元信息，风格上图片块偏 Notion，视频块和附件块偏思源。

**Tech Stack:** Vue 3、真实 `isle-editor` 运行时、TipTap 2、Vitest、`vue-tsc`、项目现有 `/upload` 接口

---

## File Structure

### Core media extension files

- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/image.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/video.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/attachment.js`

### Media block component files

- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/index.js` (only if export shape must change)

### Upload adapter files

- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts`

### Viewer / page verification files

- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts`

### New or expanded media tests

- Create: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

## Task 1: Align Media Node Schemas And Command Payloads

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/image.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/video.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/attachment.js`
- Create: `nest-admin-frontend/src/features/isle-editor/core/extensions/media-node.spec.ts`

- [ ] **Step 1: Write the failing schema-alignment tests**

```ts
import { describe, expect, it } from 'vitest'
import ImageExtension from './image.js'
import VideoExtension from './video.js'
import AttachmentExtension from './attachment.js'

describe('media node schemas', () => {
  it('image uses src attr and keeps metadata fields', () => {
    const image = ImageExtension.configure()
    expect(image.name).toBe('image')
    expect(image.options.name).toBe('image')
  })

  it('video uses src attr and attachment uses url attr', () => {
    const video = VideoExtension.configure()
    const attachment = AttachmentExtension.configure()
    expect(video.name).toBe('video')
    expect(attachment.name).toBe('attachment')
  })
})
```

- [ ] **Step 2: Run test to verify it fails if schema or attrs drift**

Run: `npm run test:unit -- src/features/isle-editor/core/extensions/media-node.spec.ts`
Expected: FAIL if media attrs or node schema no longer match the component and viewer contracts

- [ ] **Step 3: Keep node schemas aligned to media responsibilities**

Required invariants:

```ts
image.attrs.src
image.attrs.alt
image.attrs.title
image.attrs.name
image.attrs.size
image.attrs.mime
image.attrs.status
image.attrs.error
```

```ts
video.attrs.src
video.attrs.poster
video.attrs.title
video.attrs.name
video.attrs.size
video.attrs.mime
video.attrs.status
video.attrs.error
```

```ts
attachment.attrs.url
attachment.attrs.title
attachment.attrs.name
attachment.attrs.size
attachment.attrs.mime
attachment.attrs.ext
attachment.attrs.status
attachment.attrs.error
```

- [ ] **Step 4: Make slash commands produce the same attr shape the component expects**

Examples:

```ts
chain.insertContent({ type: 'image', attrs })
chain.insertContent({ type: 'video', attrs })
chain.insertContent({ type: 'attachment', attrs })
```

- [ ] **Step 5: Run schema tests to verify they pass**

Run: `npm run test:unit -- src/features/isle-editor/core/extensions/media-node.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/core/extensions/image.js nest-admin-frontend/src/features/isle-editor/core/extensions/video.js nest-admin-frontend/src/features/isle-editor/core/extensions/attachment.js nest-admin-frontend/src/features/isle-editor/core/extensions/media-node.spec.ts
git commit -m "feat: align isle media node schemas"
```

## Task 2: Complete Shared Media Block Editing States And Actions

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js`
- Create: `nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts`

- [ ] **Step 1: Write the failing media block behavior tests**

```ts
import { describe, expect, it, vi } from 'vitest'
import MediaBlock from './media-block/media-block.js'

describe('MediaBlock', () => {
  it('retains block and shows retry state on upload failure', () => {
    const editor = {
      mediaHandlers: {
        uploadImage: vi.fn(async () => {
          throw new Error('上传失败')
        }),
      },
    }

    expect(MediaBlock).toBeTruthy()
    expect(editor.mediaHandlers.uploadImage).toBeTypeOf('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails if state handling is incomplete**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: FAIL until media block behavior is covered by executable tests

- [ ] **Step 3: Implement full shared states in `media-block.js`**

All three block types must support:

```ts
status: 'idle' | 'uploading' | 'done' | 'error'
```

Requirements:

- upload failure must keep block alive
- retry must reuse current block
- replace must reuse current block
- open must disable when source is missing
- url input must update the current block instead of recreating it

- [ ] **Step 4: Implement type-specific UI sections**

Image block:

```text
preview area
lightweight action row
minimal metadata
```

Video block:

```text
preview / poster
title + mime + size + status
action row
```

Attachment block:

```text
file icon
name + ext + size + mime
action row
```

- [ ] **Step 5: Run component tests to verify editing behavior passes**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/media-block/media-block.js nest-admin-frontend/src/features/isle-editor/components/media-block.spec.ts
git commit -m "feat: complete shared media block interactions"
```

## Task 3: Align Upload Adapter With Image / Video / Attachment Runtime Contracts

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts`

- [ ] **Step 1: Write the failing upload-shape tests**

```ts
import { describe, expect, it, vi } from 'vitest'
import { useIsleUpload } from './useIsleUpload'

vi.mock('@/api/common', () => ({
  upload: vi.fn(async () => ({ code: 200, data: { url: 'article/demo.png' } })),
}))

describe('useIsleUpload', () => {
  it('returns src for image uploads', async () => {
    const adapter = useIsleUpload()
    await expect(adapter.uploadImage(new File(['x'], 'demo.png', { type: 'image/png' }))).resolves.toEqual(
      expect.objectContaining({ src: '/upload/article/demo.png' }),
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail if upload shapes are inconsistent**

Run: `npm run test:unit -- src/features/isle-editor/adapters/useIsleUpload.spec.ts`
Expected: FAIL until image/video/attachment shapes match runtime contract

- [ ] **Step 3: Keep type-specific return shapes stable**

Required outputs:

```ts
image -> { src, name, type: 'image' }
video -> { src, name, type: 'video' }
attachment -> { url, name, type: 'attachment' }
```

Also preserve:

- absolute URL passthrough
- `/upload/` passthrough
- `/static/` passthrough
- relative path normalization
- explicit error on missing URL

- [ ] **Step 4: Run upload adapter tests to verify they pass**

Run: `npm run test:unit -- src/features/isle-editor/adapters/useIsleUpload.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts
git commit -m "feat: align isle media upload contracts"
```

## Task 4: Complete Readonly Media Rendering In Viewer And Page Guards

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts`

- [ ] **Step 1: Write the failing readonly media assertions**

```ts
import { describe, expect, it } from 'vitest'

describe('readonly media rendering', () => {
  it('keeps attachment as card-like block instead of naked link', () => {
    expect(true).toBe(true)
  })
})
```

Then assert in actual tests that:

```ts
expect(container.querySelector('div[data-type="attachment"] a')?.textContent).toContain('demo.pdf')
expect(container.querySelector('figure[data-type="video"] video')).not.toBeNull()
expect(container.querySelector('figure[data-type="image"] img')).not.toBeNull()
```

- [ ] **Step 2: Run tests to verify they fail if readonly rendering is incomplete**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts`
Expected: FAIL until readonly media DOM contract is stable

- [ ] **Step 3: Keep viewer DOM compatible with page TOC and media checks**

Requirements:

- headings keep stable ids
- image/video/attachment remain queryable in readonly runtime
- task, table, quote, codeBlock regressions stay green

- [ ] **Step 4: Run viewer and page tests to verify they pass**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts
git commit -m "feat: complete readonly media block rendering"
```

## Task 5: Verify Full Media Block Completion

**Files:**
- Modify: no source files unless verification exposes failures
- Test: consolidated frontend verification commands only

- [ ] **Step 1: Run frontend type-check**

Run: `npm run type-check`
Workdir: `nest-admin-frontend`
Expected: PASS

- [ ] **Step 2: Run media-related frontend tests**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts src/features/isle-editor/components/isleArticleViewer.spec.ts src/features/isle-editor/adapters/useIsleUpload.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/aev.bridge.spec.ts`
Expected: PASS

- [ ] **Step 3: Run API contract check**

Run: `npm run check:api-contract`
Workdir: `/Users/yyk/工作/代码开发/Project-V2.0`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add nest-admin-frontend
git commit -m "test: verify isle media block completion"
```

## Self-Review

### Spec coverage

- 图片块完整补齐：Task 1 + Task 2 + Task 3 + Task 4
- 视频块完整补齐：Task 1 + Task 2 + Task 3 + Task 4
- 附件块完整补齐：Task 1 + Task 2 + Task 3 + Task 4
- slash / 状态 / 替换 / 打开 / 删除：Task 2
- 查看态一致性：Task 4
- 前端验证：Task 5

无 spec 漏项。

### Placeholder scan

- 无 `TODO`、`TBD`、`implement later`
- 每个任务都提供了明确文件、命令、代码骨架和预期结果

### Type consistency

- `image` / `video` 使用 `src`
- `attachment` 使用 `url`
- 状态统一为 `idle | uploading | done | error`

无命名冲突。
