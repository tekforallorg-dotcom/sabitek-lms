import { Node, mergeAttributes } from '@tiptap/core'
import { TextSelection, NodeSelection } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * Phase 3 — Notion-style block nodes for the lesson composer.
 *
 * These render into the SAME markup the shared lesson-content stylesheet
 * already targets ([data-callout], .lesson-columns/.lesson-column,
 * a.lesson-cta), so authoring here is true WYSIWYG with the learner reader.
 * No CSS work is needed on top of this file.
 */

type InsertProps = {
  state: any
  dispatch: ((tr: any) => void) | undefined
  tr: any
}

// Insert a block node at the caret's top-level block: replace the current
// paragraph when it's empty (the common slash-menu case, which leaves an empty
// paragraph after deleting "/query"), otherwise drop it after the block.
// `select` receives the doc position where the node begins and returns the
// selection to place afterwards.
function insertBlockNode(
  node: ProseMirrorNode,
  select: (doc: any, pos: number) => any,
) {
  return ({ state, dispatch, tr }: InsertProps) => {
    const { $from } = state.selection
    const depth = $from.depth
    const blockStart = $from.before(depth)
    const parentBlock = $from.node(depth)
    const isEmptyBlock =
      parentBlock.type.name === 'paragraph' && parentBlock.content.size === 0

    let insertPos: number
    if (isEmptyBlock) {
      tr.replaceWith(blockStart, $from.after(depth), node)
      insertPos = blockStart
    } else {
      const after = $from.after(depth)
      tr.insert(after, node)
      insertPos = after
    }

    tr.setSelection(select(tr.doc, insertPos))
    if (dispatch) dispatch(tr.scrollIntoView())
    return true
  }
}

// Mod-Enter escape: insert a fresh paragraph immediately after the nearest
// ancestor of `nodeName` and drop the cursor into it.
function exitBlockShortcut(nodeName: string) {
  return ({ editor }: { editor: any }) => {
    const { $from } = editor.state.selection
    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.name === nodeName) {
        const after = $from.after(depth)
        return editor
          .chain()
          .insertContentAt(after, { type: 'paragraph' })
          .setTextSelection(after + 1)
          .focus()
          .run()
      }
    }
    return false
  }
}

const CALLOUT_VARIANTS = ['info', 'tip', 'warning', 'example', 'key']

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'paragraph+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (element: HTMLElement) => {
          const v = element.getAttribute('data-callout')
          return v && CALLOUT_VARIANTS.includes(v) ? v : 'info'
        },
        renderHTML: (attributes: { variant?: string }) => ({
          'data-callout': attributes.variant || 'info',
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0]
  },

  addCommands() {
    return {
      insertCallout:
        (variant = 'info') =>
        ({ state, dispatch, tr }: InsertProps) => {
          const { schema } = state
          const node = schema.nodes.callout.create({ variant }, [
            schema.nodes.paragraph.create(),
          ])
          // +2: past callout open, past paragraph open, into the empty paragraph.
          return insertBlockNode(node, (doc, pos) =>
            TextSelection.create(doc, pos + 2),
          )({ state, dispatch, tr })
        },
    } as any
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': exitBlockShortcut(this.name),
    }
  },
})

export const Column = Node.create({
  name: 'column',
  content: 'block+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'div.lesson-column' }]
  },

  renderHTML() {
    return ['div', { class: 'lesson-column' }, 0]
  },
})

export const Columns = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column column',

  parseHTML() {
    return [{ tag: 'div.lesson-columns' }]
  },

  renderHTML() {
    return ['div', { class: 'lesson-columns' }, 0]
  },

  addCommands() {
    return {
      insertColumns:
        () =>
        ({ state, dispatch, tr }: InsertProps) => {
          const { schema } = state
          const column = () =>
            schema.nodes.column.create(null, [schema.nodes.paragraph.create()])
          const node = schema.nodes.columns.create(null, [column(), column()])
          // +3: past columns open, past first column open, past paragraph open.
          return insertBlockNode(node, (doc, pos) =>
            TextSelection.create(doc, pos + 3),
          )({ state, dispatch, tr })
        },
    } as any
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': exitBlockShortcut(this.name),
    }
  },
})

export const CtaButton = Node.create({
  name: 'ctaButton',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      text: {
        default: 'Open link',
        parseHTML: (element: HTMLElement) =>
          element.textContent?.trim() || 'Open link',
        // rendered as the node's child text, not an attribute
        renderHTML: () => ({}),
      },
      href: {
        default: '#',
        parseHTML: (element: HTMLElement) => element.getAttribute('href') || '#',
        renderHTML: (attributes: { href?: string }) => ({
          href: attributes.href || '#',
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'a.lesson-cta' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'a',
      mergeAttributes({ class: 'lesson-cta' }, HTMLAttributes),
      node.attrs.text || 'Open link',
    ]
  },

  addCommands() {
    return {
      insertCtaButton:
        () =>
        ({ state, dispatch, tr }: InsertProps) => {
          const node = state.schema.nodes.ctaButton.create()
          return insertBlockNode(node, (doc, pos) =>
            NodeSelection.create(doc, pos),
          )({ state, dispatch, tr })
        },
    } as any
  },
})
