'use client';

import dynamic from 'next/dynamic';
import type Quill from 'quill';
import { type FC, useEffect, useRef } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // quill-resize-image の画像サイズ入力欄でEnterキーを押した際に
  // フォーム送信（submit）が発火する問題を防止する
  // ライブラリはchangeイベント（blur時）のみリッスンしているため、
  // Enterキーでchangeイベントを手動発火させてからblurする
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;

      const target = e.target as HTMLElement;
      // #editor-resizer 内のinput要素でのみ処理
      if (
        target.tagName === 'INPUT' &&
        target.closest('#editor-resizer')
      ) {
        // フォームsubmitを防止
        e.preventDefault();
        e.stopPropagation();

        // changeイベントを手動発火（ライブラリのtoolbarInputChangeを呼び出す）
        target.dispatchEvent(new Event('change', { bubbles: true }));

        // inputからフォーカスを外す
        (target as HTMLInputElement).blur();
      }
    };

    container.addEventListener('keydown', handleKeyDown, true);
    return () => {
      container.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // quill-resize-image のツールバーを拡張する
  // ライブラリのデフォルトは100%と50%のみ → 25%/50%/75%/100%に拡張し、
  // 入力欄の上限を撤廃して任意の倍率を入力可能にする
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const enhanceResizeToolbar = (resizer: HTMLElement) => {
      const toolbar = resizer.querySelector('.toolbar');
      if (!toolbar) return;

      // 最初のgroupを取得（幅プリセットボタン群）
      const widthGroup = toolbar.querySelector('.group');
      if (!widthGroup) return;

      // 既にカスタマイズ済みならスキップ
      if (widthGroup.getAttribute('data-enhanced') === 'true') return;
      widthGroup.setAttribute('data-enhanced', 'true');

      // 既存のボタンをすべて削除
      widthGroup.innerHTML = '';

      // プリセットボタンを作成: 25%, 50%, 75%, 100%
      const presets = [
        { label: '25%', styles: 'width:25%' },
        { label: '50%', styles: 'width:50%' },
        { label: '75%', styles: 'width:75%' },
        { label: '100%', styles: 'width:100%' },
      ];

      for (const preset of presets) {
        const btn = document.createElement('a');
        btn.className = 'btn';
        btn.setAttribute('data-type', 'width');
        btn.setAttribute('data-styles', preset.styles);
        btn.textContent = preset.label;
        widthGroup.appendChild(btn);
      }

      // 任意の%入力欄を追加
      const inputWrapper = document.createElement('span');
      inputWrapper.className = 'input-wrapper';
      const input = document.createElement('input');
      input.setAttribute('data-type', 'width');
      input.setAttribute('maxlength', '4'); // 最大4桁（例: 150%, 200%）
      input.setAttribute('placeholder', '任意');
      const suffix = document.createElement('span');
      suffix.className = 'suffix';
      suffix.textContent = '%';
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip';
      tooltip.textContent = 'Enterで適用';
      inputWrapper.appendChild(input);
      inputWrapper.appendChild(suffix);
      inputWrapper.appendChild(tooltip);
      widthGroup.appendChild(inputWrapper);

      // 復元ボタン
      const restoreBtn = document.createElement('a');
      restoreBtn.className = 'btn';
      restoreBtn.setAttribute('data-type', 'width');
      restoreBtn.setAttribute('data-styles', 'width:auto');
      restoreBtn.textContent = '復元';
      widthGroup.appendChild(restoreBtn);
    };

    // MutationObserverで#editor-resizerの出現を検知
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            if (node.id === 'editor-resizer') {
              enhanceResizeToolbar(node);
            }
            const resizer = node.querySelector?.('#editor-resizer');
            if (resizer instanceof HTMLElement) {
              enhanceResizeToolbar(resizer);
            }
          }
        }
      }
    });

    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const handleChange = (content: string) => {
    console.log('RichTextEditor content changed:', content);
    onChange(content);
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
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
        /* 拡張リサイズツールバーのスタイル */
        #editor-resizer .toolbar {
          width: 24em !important;
        }
        #editor-resizer .toolbar .group .btn {
          font-size: 12px;
          cursor: pointer;
        }
        #editor-resizer .toolbar .group .btn:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        #editor-resizer .toolbar .group .input-wrapper input {
          font-size: 12px;
        }
        #editor-resizer .toolbar .group .input-wrapper input::placeholder {
          color: #aaa;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
};
