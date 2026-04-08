'use client';

import dynamic from 'next/dynamic';
import type { FC } from 'react';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    const { default: QuillLib } = await import('quill');

    // カスタムImageFormatを登録して、style属性（画像サイズ等）を保持する
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

    return RQ;
  },
  { ssr: false },
);
import 'react-quill-new/dist/quill.snow.css';

interface RichTextViewerProps {
  value: string;
  className?: string;
}

export const RichTextViewer: FC<RichTextViewerProps> = ({
  value,
  className,
}) => {
  return (
    <div
      className={`rich-text-viewer ${className || ''}`}
      style={{ width: '100%' }}
    >
      <ReactQuill
        value={value || ''}
        readOnly
        theme="snow"
        modules={{
          toolbar: false, // ツールバーを非表示
        }}
      />
      <style>{`
        .rich-text-viewer .ql-editor {
          min-height: auto !important;
          max-height: none !important;
          padding: 12px 15px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background-color: #f9fafb;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
        .rich-text-viewer .ql-container {
          border: none !important;
          font-family: inherit !important;
          max-width: 100% !important;
        }
        .rich-text-viewer .ql-snow {
          border: none !important;
        }
        .rich-text-viewer .ql-toolbar {
          display: none !important;
        }
        .rich-text-viewer .ql-editor p {
          word-wrap: break-word !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
        .rich-text-viewer .ql-editor img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
};
