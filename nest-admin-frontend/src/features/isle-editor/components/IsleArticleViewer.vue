<script setup lang="ts">
import { computed, defineComponent, h, type PropType, type VNode } from 'vue'

import {
  createEmptyIsleContent,
  type IsleContentDocument,
  type IsleContentNode,
} from '../adapters/isleContent'

interface IsleArticleViewerProps {
  content?: IsleContentDocument | null
}

interface RenderTextNode {
  kind: 'text'
  text: string
}

interface RenderElementNode {
  kind: 'element'
  tag: 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'ul' | 'ol' | 'li' | 'blockquote' | 'pre' | 'code' | 'hr' | 'img' | 'a' | 'video' | 'table' | 'tbody' | 'tr' | 'th' | 'td' | 'br'
  key: string
  id?: string
  children: RenderNode[]
  attrs?: Record<string, unknown>
}

type RenderNode = RenderTextNode | RenderElementNode

const props = withDefaults(defineProps<IsleArticleViewerProps>(), {
  content: null,
})

const documentValue = computed<IsleContentDocument>(() => props.content ?? createEmptyIsleContent())
const renderedNodes = computed<RenderNode[]>(() => buildRenderNodes(documentValue.value))

const RenderNodes = defineComponent({
  name: 'IsleArticleViewerRenderNodes',
  props: {
    nodes: {
      type: Array as PropType<RenderNode[]>,
      required: true,
    },
  },
  setup(componentProps) {
    function renderNodeTree(node: RenderNode): VNode | string {
      if (node.kind === 'text') {
        return node.text
      }

      return h(
        node.tag,
        {
          id: node.id,
          key: node.key,
          class: 'isle-article-viewer__node',
          ...node.attrs,
        },
        node.children.map((child) => renderNodeTree(child)),
      )
    }

    return () => componentProps.nodes.map((node) => renderNodeTree(node))
  },
})

function isHeadingNode(node: IsleContentNode): boolean {
  return node.type === 'heading' && typeof node.attrs?.level === 'number'
}

function normalizeChildren(children: IsleContentNode['content']): IsleContentNode[] {
  return Array.isArray(children) ? children : []
}

function createTextNode(text: string): RenderTextNode | null {
  if (!text) {
    return null
  }

  return {
    kind: 'text',
    text,
  }
}

function createElementNode(
  tag: RenderElementNode['tag'],
  key: string,
  children: RenderNode[],
  id?: string,
  attrs?: Record<string, unknown>,
): RenderElementNode | null {
  if (!children.length && !['hr', 'img', 'video', 'br'].includes(tag)) {
    return null
  }

  return {
    kind: 'element',
    tag,
    key,
    id,
    children,
    attrs,
  }
}

function renderChildren(children: IsleContentNode['content'], headingCounter: { value: number }, path: string): RenderNode[] {
  return normalizeChildren(children)
    .map((child, index) => renderNode(child, headingCounter, `${path}-${index}`))
    .filter((node): node is RenderNode => node !== null)
}

function renderHeading(node: IsleContentNode, headingCounter: { value: number }, path: string): RenderElementNode | null {
  if (!isHeadingNode(node)) {
    return null
  }

  headingCounter.value += 1
  const level = Number(node.attrs?.level) as 1 | 2 | 3 | 4 | 5 | 6
  const tag = `h${level}` as RenderElementNode['tag']

  return createElementNode(tag, path, renderChildren(node.content, headingCounter, path), `heading-${headingCounter.value}`)
}

function renderNode(node: IsleContentNode | null | undefined, headingCounter: { value: number }, path: string): RenderNode | null {
  if (!node) {
    return null
  }

  if (isHeadingNode(node)) {
    return renderHeading(node, headingCounter, path)
  }

  if (node.type === 'paragraph') {
    return createElementNode('p', path, renderChildren(node.content, headingCounter, path))
  }

  if (node.type === 'bulletList') {
    return createElementNode('ul', path, renderChildren(node.content, headingCounter, path))
  }

  if (node.type === 'orderedList') {
    return createElementNode('ol', path, renderChildren(node.content, headingCounter, path))
  }

  if (node.type === 'listItem') {
    return createElementNode('li', path, renderChildren(node.content, headingCounter, path))
  }

  if (node.type === 'taskList') {
    return createElementNode('ul', path, renderChildren(node.content, headingCounter, path), undefined, {
      'data-node-type': 'taskList',
    })
  }

  if (node.type === 'taskItem') {
    return createElementNode('li', path, renderChildren(node.content, headingCounter, path), undefined, {
      'data-node-type': 'taskItem',
      'data-checked': String(node.attrs?.checked ?? false),
    })
  }

  if (node.type === 'blockquote') {
    return createElementNode('blockquote', path, renderChildren(node.content, headingCounter, path))
  }

  if (node.type === 'codeBlock') {
    const codeNode = createElementNode('code', `${path}-code`, renderChildren(node.content, headingCounter, `${path}-code`))
    return codeNode ? createElementNode('pre', path, [codeNode]) : null
  }

  if (node.type === 'horizontalRule' || node.type === 'divider') {
    return createElementNode('hr', path, [], undefined, {
      'data-node-type': node.type,
    })
  }

  if (node.type === 'hardBreak') {
    return createElementNode('br', path, [])
  }

  if (node.type === 'image') {
    return createElementNode('img', path, [], undefined, {
      src: String(node.attrs?.src || ''),
      alt: String(node.attrs?.alt || ''),
    })
  }

  if (node.type === 'attachment') {
    const label = String(node.attrs?.name || node.attrs?.url || '附件')
    const textNode = createTextNode(label)
    return textNode
      ? createElementNode('a', path, [textNode], undefined, {
          href: String(node.attrs?.url || ''),
          target: '_blank',
          rel: 'noreferrer',
          'data-node-type': 'attachment',
        })
      : null
  }

  if (node.type === 'video') {
    return createElementNode('video', path, [], undefined, {
      src: String(node.attrs?.src || node.attrs?.url || ''),
      controls: true,
      'data-node-type': 'video',
    })
  }

  if (node.type === 'table') {
    const bodyNode = createElementNode('tbody', `${path}-body`, renderChildren(node.content, headingCounter, `${path}-body`))
    return bodyNode ? createElementNode('table', path, [bodyNode]) : null
  }

  if (node.type === 'tableRow') {
    return createElementNode('tr', path, renderChildren(node.content, headingCounter, path))
  }

  if (node.type === 'tableHeader') {
    return createElementNode('th', path, renderChildren(node.content, headingCounter, path))
  }

  if (node.type === 'tableCell') {
    return createElementNode('td', path, renderChildren(node.content, headingCounter, path))
  }

  if (node.type === 'text') {
    return createTextNode(typeof node.text === 'string' ? node.text : '')
  }

  return createElementNode('div', path, renderChildren(node.content, headingCounter, path))
}

function buildRenderNodes(document: IsleContentDocument): RenderNode[] {
  const headingCounter = { value: 0 }

  return document.content
    .map((node, index) => renderNode(node, headingCounter, `node-${index}`))
    .filter((node): node is RenderNode => node !== null)
}
</script>

<template>
  <div
    class="isle-article-viewer"
    data-testid="isle-article-viewer"
    aria-readonly="true"
    role="article"
  >
    <RenderNodes :nodes="renderedNodes" />
  </div>
</template>

<style scoped>
.isle-article-viewer {
  width: 100%;
  min-height: 24px;
}

.isle-article-viewer__node {
  word-break: break-word;
}
</style>
