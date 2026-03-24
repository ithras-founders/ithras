/**
 * Rich HTML editor for LongForm post body (TipTap) — sticky left rail formatting.
 */
import React, { useEffect, useCallback, useReducer } from 'react';
import htm from 'htm';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { uploadLongformImage } from '/shared/services/longformApi.js';

const html = htm.bind(React.createElement);

const LF_FONT_SIZES = ['14px', '17px', '20px', '24px'];
const LF_FF_SERIF = 'Georgia, "Times New Roman", serif';
const LF_FF_SANS = 'ui-sans-serif, system-ui, sans-serif';
const LF_FF_MONO = 'ui-monospace, monospace';

const LongFormFontSizePresets = Extension.create({
  name: 'longFormFontSizePresets',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => {
              const fs = element.style.fontSize?.trim();
              return fs && LF_FONT_SIZES.includes(fs) ? fs : null;
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize || !LF_FONT_SIZES.includes(attributes.fontSize)) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const ToolBtn = ({ active, disabled, onClick, children, title }) => html`
  <button
    type="button"
    disabled=${disabled}
    title=${title || undefined}
    onClick=${onClick}
    className="longform-menu-btn"
    data-active=${active ? 'true' : 'false'}
  >
    ${children}
  </button>
`;

export const LongFormEditorRail = ({ editor, publicationId }) => {
  const [, bump] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return undefined;
    const fn = () => bump();
    editor.on('transaction', fn);
    return () => editor.off('transaction', fn);
  }, [editor]);

  const dead = !editor || editor.isDestroyed;

  const pickImage = useCallback(() => {
    if (dead || publicationId == null) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const res = await uploadLongformImage(publicationId, file);
        if (res?.url) editor.chain().focus().setImage({ src: res.url }).run();
      } catch (e) {
        window.alert(e?.message || 'Image upload failed');
      }
    };
    input.click();
  }, [editor, publicationId, dead]);

  const setLink = useCallback(() => {
    if (dead) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', prev || 'https://');
    if (url === null) return;
    const trimmed = (url || '').trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  }, [editor, dead]);

  const ts = dead ? {} : editor.getAttributes('textStyle');
  const { fontFamily: curFf, fontSize: curFs } = ts;

  const setFontPreset = (family) => {
    if (dead) return;
    if (curFf === family) {
      editor.chain().focus().unsetFontFamily().run();
      return;
    }
    editor.chain().focus().setFontFamily(family).run();
  };

  const setSizePreset = (size) => {
    if (dead) return;
    if (curFs === size) {
      editor.chain().focus().updateAttributes('textStyle', { fontSize: null }).run();
      return;
    }
    const attrs = { ...editor.getAttributes('textStyle'), fontSize: size };
    editor.chain().focus().setMark('textStyle', attrs).run();
  };

  const clearTypography = () => {
    if (dead) return;
    editor.chain().focus().unsetMark('textStyle').run();
  };

  return html`
    <div className="longform-composer-rail-inner px-3 py-4 md:px-4 md:py-6 space-y-5">
      <div className="longform-rail-section">
        <h3 className="longform-rail-section-title">Typography</h3>
        <div className="longform-rail-section-btns flex flex-wrap gap-1">
          <${ToolBtn}
            active=${curFf === LF_FF_SERIF}
            disabled=${dead}
            onClick=${() => setFontPreset(LF_FF_SERIF)}
            title="Serif (Georgia)"
          >Serif</${ToolBtn}>
          <${ToolBtn}
            active=${curFf === LF_FF_SANS}
            disabled=${dead}
            onClick=${() => setFontPreset(LF_FF_SANS)}
            title="Sans (system UI)"
          >Sans</${ToolBtn}>
          <${ToolBtn}
            active=${curFf === LF_FF_MONO}
            disabled=${dead}
            onClick=${() => setFontPreset(LF_FF_MONO)}
            title="Monospace"
          >Mono</${ToolBtn}>
        </div>
        <div className="longform-rail-section-btns flex flex-wrap gap-1 mt-2">
          ${LF_FONT_SIZES.map(
            (sz) => html`<${ToolBtn}
              key=${sz}
              active=${curFs === sz}
              disabled=${dead}
              onClick=${() => setSizePreset(sz)}
              title=${`Font size ${sz}`}
            >${sz}</${ToolBtn}>`,
          )}
        </div>
        <div className="mt-2">
          <${ToolBtn}
            active=${false}
            disabled=${dead}
            onClick=${clearTypography}
            title="Clear font and size presets"
            >Reset type</${ToolBtn}>
        </div>
      </div>

      <div className="longform-rail-section">
        <h3 className="longform-rail-section-title">Format</h3>
        <div className="longform-rail-section-btns flex flex-wrap gap-1">
          <${ToolBtn}
            active=${!dead && editor.isActive('bold')}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleBold().run()}
            >Bold</${ToolBtn}>
          <${ToolBtn}
            active=${!dead && editor.isActive('italic')}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleItalic().run()}
            >Italic</${ToolBtn}>
          <${ToolBtn}
            active=${!dead && editor.isActive('underline')}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleUnderline().run()}
            >Underline</${ToolBtn}>
          <${ToolBtn}
            active=${!dead && editor.isActive('superscript')}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleSuperscript().run()}
            >Sup</${ToolBtn}>
          <${ToolBtn}
            active=${!dead && editor.isActive('subscript')}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleSubscript().run()}
            >Sub</${ToolBtn}>
          <${ToolBtn}
            active=${!dead && editor.isActive('code')}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleCode().run()}
            >Code</${ToolBtn}>
        </div>
      </div>

      <div className="longform-rail-section">
        <h3 className="longform-rail-section-title">Blocks</h3>
        <div className="longform-rail-section-btns flex flex-wrap gap-1">
          <${ToolBtn}
            active=${!dead && editor.isActive('heading', { level: 2 })}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >H2</${ToolBtn}>
          <${ToolBtn}
            active=${!dead && editor.isActive('heading', { level: 3 })}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >H3</${ToolBtn}>
          <${ToolBtn}
            active=${!dead && editor.isActive('bulletList')}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleBulletList().run()}
            >• List</${ToolBtn}>
          <${ToolBtn}
            active=${!dead && editor.isActive('orderedList')}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleOrderedList().run()}
            >1. List</${ToolBtn}>
          <${ToolBtn}
            active=${!dead && editor.isActive('blockquote')}
            disabled=${dead}
            onClick=${() => editor.chain().focus().toggleBlockquote().run()}
            >Quote</${ToolBtn}>
        </div>
      </div>

      <div className="longform-rail-section">
        <h3 className="longform-rail-section-title">Insert</h3>
        <div className="longform-rail-section-btns flex flex-wrap gap-1">
          <${ToolBtn}
            active=${!dead && editor.isActive('link')}
            disabled=${dead}
            onClick=${setLink}
            title="Add or edit link"
            >Link</${ToolBtn}>
          <${ToolBtn}
            active=${false}
            disabled=${dead || publicationId == null}
            onClick=${pickImage}
            title="Insert image"
            >Image</${ToolBtn}>
        </div>
      </div>
    </div>
  `;
};

const LongFormRichEditor = ({ value, onChange, publicationId, onEditorReady }) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Superscript,
      Subscript,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' },
      }),
      Placeholder.configure({
        placeholder: 'Tell your story…',
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      LongFormFontSizePresets,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'longform-tiptap-editor longform-composer-prose focus:outline-none min-h-[min(55vh,520px)] py-1 text-[17px] leading-[1.75]',
        style: 'color: var(--app-text-primary);',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    const ed = editor && !editor.isDestroyed ? editor : null;
    onEditorReady?.(ed);
    return () => {
      if (ed) onEditorReady?.(null);
    };
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = value || '';
    const cur = editor.getHTML();
    if (next !== cur) {
      editor.commands.setContent(next, false);
    }
  }, [value, editor]);

  if (!editor) {
    return html`<div
      className="min-h-[min(55vh,520px)] rounded-lg animate-pulse"
      style=${{ background: 'var(--app-surface-subtle)' }}
      aria-busy="true"
    />`;
  }

  return html`
    <div className="longform-composer-editor relative -mx-1">
      <${EditorContent} editor=${editor} />
    </div>
  `;
};

export default LongFormRichEditor;
