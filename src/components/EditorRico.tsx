'use client'

import { useEffect, type ComponentType } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import {
  IconAlignCenter,
  IconAlignJustified,
  IconAlignLeft,
  IconAlignRight,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconClearFormatting,
  IconH3,
  IconItalic,
  IconLink,
  IconLinkOff,
  IconList,
  IconListNumbers,
  IconStrikethrough,
  IconUnderline,
} from '@tabler/icons-react'
import { paraHtml } from '@/lib/textoRico'

// Editor de texto com formatação (negrito, listas, alinhamento, links…).
// Salva HTML; o backend conta só o texto visível no limite de caracteres e
// quem exibe passa sempre pelo componente TextoRico, que higieniza o HTML.

type Icone = ComponentType<{ size?: number; stroke?: number; 'aria-hidden'?: boolean }>

function Botao({ rotulo, Icone, ativo, desabilitado, onClick }: { rotulo: string; Icone: Icone; ativo?: boolean; desabilitado?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      aria-pressed={ativo === undefined ? undefined : ativo}
      disabled={desabilitado}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="editor-rico-botao"
      data-ativo={ativo ? 'true' : undefined}
    >
      <Icone size={17} stroke={1.8} aria-hidden />
    </button>
  )
}

function Separador() {
  return <span aria-hidden="true" style={{ width: 1, alignSelf: 'stretch', background: 'var(--c-divider)', margin: '0 0.125rem' }} />
}

function editarLink(editor: Editor) {
  const atual = editor.getAttributes('link').href as string | undefined
  const url = window.prompt('Endereço do link (https://…)', atual ?? 'https://')
  if (url === null) return
  const limpo = url.trim()
  if (!limpo || limpo === 'https://') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  const href = /^(https?:|mailto:|tel:)/i.test(limpo) ? limpo : `https://${limpo}`
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
}

function BarraFerramentas({ editor }: { editor: Editor }) {
  const estado = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      negrito: e.isActive('bold'),
      italico: e.isActive('italic'),
      sublinhado: e.isActive('underline'),
      tachado: e.isActive('strike'),
      titulo: e.isActive('heading', { level: 3 }),
      marcadores: e.isActive('bulletList'),
      numerada: e.isActive('orderedList'),
      esquerda: e.isActive({ textAlign: 'left' }),
      centro: e.isActive({ textAlign: 'center' }),
      direita: e.isActive({ textAlign: 'right' }),
      justificado: e.isActive({ textAlign: 'justify' }),
      link: e.isActive('link'),
      podeDesfazer: e.can().undo(),
      podeRefazer: e.can().redo(),
    }),
  })
  const c = () => editor.chain().focus()

  return (
    <div role="toolbar" aria-label="Formatação do texto" className="editor-rico-barra">
      <Botao rotulo="Negrito" Icone={IconBold} ativo={estado.negrito} onClick={() => c().toggleBold().run()} />
      <Botao rotulo="Itálico" Icone={IconItalic} ativo={estado.italico} onClick={() => c().toggleItalic().run()} />
      <Botao rotulo="Sublinhado" Icone={IconUnderline} ativo={estado.sublinhado} onClick={() => c().toggleUnderline().run()} />
      <Botao rotulo="Tachado" Icone={IconStrikethrough} ativo={estado.tachado} onClick={() => c().toggleStrike().run()} />
      <Separador />
      <Botao rotulo="Subtítulo" Icone={IconH3} ativo={estado.titulo} onClick={() => c().toggleHeading({ level: 3 }).run()} />
      <Botao rotulo="Lista com marcadores" Icone={IconList} ativo={estado.marcadores} onClick={() => c().toggleBulletList().run()} />
      <Botao rotulo="Lista numerada" Icone={IconListNumbers} ativo={estado.numerada} onClick={() => c().toggleOrderedList().run()} />
      <Separador />
      <Botao rotulo="Alinhar à esquerda" Icone={IconAlignLeft} ativo={estado.esquerda} onClick={() => c().setTextAlign('left').run()} />
      <Botao rotulo="Centralizar" Icone={IconAlignCenter} ativo={estado.centro} onClick={() => c().setTextAlign('center').run()} />
      <Botao rotulo="Alinhar à direita" Icone={IconAlignRight} ativo={estado.direita} onClick={() => c().setTextAlign('right').run()} />
      <Botao rotulo="Justificar" Icone={IconAlignJustified} ativo={estado.justificado} onClick={() => c().setTextAlign('justify').run()} />
      <Separador />
      <Botao rotulo={estado.link ? 'Editar link' : 'Inserir link'} Icone={IconLink} ativo={estado.link} onClick={() => editarLink(editor)} />
      {estado.link && <Botao rotulo="Remover link" Icone={IconLinkOff} onClick={() => c().extendMarkRange('link').unsetLink().run()} />}
      <Botao rotulo="Limpar formatação" Icone={IconClearFormatting} onClick={() => c().unsetAllMarks().clearNodes().unsetTextAlign().run()} />
      <Separador />
      <Botao rotulo="Desfazer" Icone={IconArrowBackUp} desabilitado={!estado.podeDesfazer} onClick={() => c().undo().run()} />
      <Botao rotulo="Refazer" Icone={IconArrowForwardUp} desabilitado={!estado.podeRefazer} onClick={() => c().redo().run()} />
    </div>
  )
}

export default function EditorRico({
  valor,
  onChange,
  rotulo,
  placeholder,
  max,
  linhas = 4,
}: {
  valor: string | null
  onChange: (v: string) => void
  rotulo: string
  placeholder?: string
  max?: number
  linhas?: number
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [3, 4] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        trailingNode: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['mailto', 'tel'] },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount.configure({ limit: max ?? null }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: paraHtml(valor),
    editorProps: {
      attributes: {
        class: 'texto-rico editor-rico-area',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': rotulo,
        style: `min-height: ${linhas * 1.55 + 1.25}em`,
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  })

  // Valor trocado por fora (ex.: descartar alterações) — atualiza sem disparar onChange
  useEffect(() => {
    if (!editor || editor.isFocused) return
    const atual = editor.isEmpty ? '' : editor.getHTML()
    const novo = paraHtml(valor)
    if (novo !== atual) editor.commands.setContent(novo, { emitUpdate: false })
  }, [valor, editor])

  return (
    <div className="editor-rico">
      {editor && <BarraFerramentas editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}
