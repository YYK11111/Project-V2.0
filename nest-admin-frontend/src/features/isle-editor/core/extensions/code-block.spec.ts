import { describe, expect, it, vi } from 'vitest'

import CodeBlockExtension from './code-block.js'

describe('codeBlock extension', () => {
  it('slash 命令插入代码块时只插入代码块本身', () => {
    const run = vi.fn(() => true)
    const chain = {
      focus: vi.fn(() => chain),
      deleteRange: vi.fn(() => chain),
      insertContent: vi.fn(() => chain),
      run,
    }

    const editor = {
      chain: vi.fn(() => chain),
      commands: {
        toggleCodeBlock: vi.fn(),
      },
    }

    const extension = CodeBlockExtension.configure()
    extension.options.command({
      editor,
      range: { from: 1, to: 2 },
    })

    expect(chain.insertContent).toHaveBeenCalledWith({
      type: 'codeBlock',
    })
    expect(run).toHaveBeenCalled()
  })

  it('代码块内空行再次回车时应退出到新的段落块', () => {
    const run = vi.fn(() => true)
    const chain = {
      focus: vi.fn(() => chain),
      command: vi.fn((callback) => {
        callback({
          tr: {
            delete: vi.fn(),
          },
        })
        return chain
      }),
      exitCode: vi.fn(() => chain),
      run,
    }

    const editor = {
      isActive: vi.fn(() => true),
      state: {
        selection: {
          empty: true,
          $from: {
            pos: 5,
            parentOffset: 4,
            parent: {
              type: {
                name: 'codeBlock',
              },
              textContent: '正文\n\n',
            },
          },
        },
      },
      chain: vi.fn(() => chain),
    }

    const extension = CodeBlockExtension.configure()
    const shortcuts = extension.config.addKeyboardShortcuts.call(extension)
    const handled = shortcuts.Enter?.({ editor })

    expect(handled).toBe(true)
    expect(chain.command).toHaveBeenCalled()
    expect(chain.exitCode).toHaveBeenCalled()
    expect(run).toHaveBeenCalled()
  })
})
