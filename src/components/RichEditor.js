'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import styles from './RichEditor.module.css'

function countWords(html) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.split(' ').length : 0
}

const ToolBtn = ({ onClick, active, title, children }) => (
  <button type="button" title={title}
    className={`${styles.toolBtn} ${active ? styles.active : ''}`}
    onClick={onClick}>
    {children}
  </button>
)

const Sep = () => <div className={styles.sep} />

export default function RichEditor({ value, onChange, placeholder = 'Tulis isi bab di sini...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  const wordCount = countWords(editor.getHTML())

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {/* Text style */}
        <select className={styles.headingSelect}
          value={
            editor.isActive('heading', { level: 1 }) ? '1' :
            editor.isActive('heading', { level: 2 }) ? '2' :
            editor.isActive('heading', { level: 3 }) ? '3' : '0'
          }
          onChange={e => {
            const v = e.target.value
            if (v === '0') editor.chain().focus().setParagraph().run()
            else editor.chain().focus().toggleHeading({ level: parseInt(v) }).run()
          }}>
          <option value="0">Paragraf</option>
          <option value="1">Judul 1</option>
          <option value="2">Judul 2</option>
          <option value="3">Judul 3</option>
        </select>

        <Sep />

        {/* Format */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <b>B</b>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <i>I</i>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <u>U</u>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <s>S</s>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          🖊
        </ToolBtn>

        <Sep />

        {/* Align */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Rata Kiri">
          ≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Tengah">
          ☰
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Rata Kanan">
          ≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
          ▤
        </ToolBtn>

        <Sep />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          • List
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          1. List
        </ToolBtn>

        <Sep />

        {/* Block */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          ❝
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          {'</>'}
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          ⌨
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Garis Pemisah">
          —
        </ToolBtn>

        <Sep />

        {/* History */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo (Ctrl+Z)">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo (Ctrl+Y)">↪</ToolBtn>

        <Sep />

        {/* Clear */}
        <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} active={false} title="Hapus Format">
          ✕ Format
        </ToolBtn>
      </div>

      <EditorContent editor={editor} className={styles.editor} />

      <div className={styles.footer}>
        <span className={styles.wordCount}>{wordCount.toLocaleString('id-ID')} kata</span>
      </div>
    </div>
  )
}
