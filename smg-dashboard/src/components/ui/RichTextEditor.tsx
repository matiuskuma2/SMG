'use client';

import dynamic from 'next/dynamic';
import type Quill from 'quill';
import type { FC } from 'react';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    const { default: QuillLib } = await import('quill');
    const { default: QuillResizeImage } = await import('quill-resize-image');

    // カスタムImageFormatを登録して、style属性を保持する
    // biome-ignore lint/suspicious/noExplicitAny: Quillの型定義の制限により必要
    const ImageBlot = QuillLib.import('formats/image') as any;
    class CustomImageFormat extends ImageBlot {
      static formats(domNode: HTMLElement) {
        return {
          alt: domNode.getAttribute('alt'),
          height: domNode.getAttribute('height'),
          width: domNode.getAttribute('width'),
          style: domNode.getAttribute('style'),
        };
      }

      format(name: string, value: string) {
        if (
          name === 'alt' ||
          name === 'height' ||
          name === 'width' ||
          name === 'style'
        ) {
          if (value) {
            // biome-ignore lint/suspicious/noExplicitAny: domNodeプロパティへのアクセスに必要
            (this as any).domNode.setAttribute(name, value);
          } else {
            // biome-ignore lint/suspicious/noExplicitAny: domNodeプロパティへのアクセスに必要
            (this as any).domNode.removeAttribute(name);
          }
        } else {
          super.format(name, value);
        }
      }
    }

    // biome-ignore lint/suspicious/noExplicitAny: Quillのregister関数の型定義の制限により必要
    QuillLib.register(CustomImageFormat as any, true);
    QuillLib.register('modules/resize', QuillResizeImage);

    return RQ;
  },
  { ssr: false },
);
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

// 画像アップロード用のカスタムハンドラ
function imageHandler(this: { quill?: Quill } & Quill) {
  const quill = this.quill || this;

  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxWidth = 800;
          const scale = Math.min(1, maxWidth / img.width);
          const width = img.width * scale;
          const height = img.height * scale;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

          if (quill && typeof quill.getSelection === 'function') {
            const range = quill.getSelection(true);
            quill.insertEmbed(range ? range.index : 0, 'image', dataUrl);
          }
        };
        if (e.target) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

const getModules = () => {
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }], // 見出し1,2,3,通常
        ['bold', 'italic', 'image'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
    resize: {
      locale: {},
    },
  };
  return modules;
};

const formats = ['header', 'bold', 'italic', 'image'];

export const RichTextEditor: FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'テキストを入力してください...',
  disabled = false,
  name,
}) => {
  const handleChange = (content: string) => {
    console.log('RichTextEditor content changed:', content);
    onChange(content);
  };

  return (
    <div style={{ width: '100%' }}>
      <ReactQuill
        value={value}
        onChange={handleChange}
        modules={getModules()}
        formats={formats}
        theme="snow"
        placeholder={placeholder}
        readOnly={disabled}
      />
      {/* フォーム送信用の隠しinput */}
      {name && <input type="hidden" name={name} value={value} />}
      <style>{`
        .ql-editor {
          min-height: 300px;
          max-height: 300px;
          overflow-y: auto;
        } 
        .ql-editor:focus::before {
          content: none !important;
        }
      `}</style>
    </div>
  );
};
