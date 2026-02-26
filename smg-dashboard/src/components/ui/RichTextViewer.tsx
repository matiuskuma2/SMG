'use client';

import dynamic from 'next/dynamic';
import type { FC } from 'react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
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
      `}</style>
    </div>
  );
};
