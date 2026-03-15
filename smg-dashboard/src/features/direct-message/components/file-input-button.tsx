'use client';

import { css } from '@/styled-system/css';
import { useRef } from 'react';
import { MdAttachFile } from 'react-icons/md';
import { validateFiles } from '../lib/image';

export const FileInputBtn = (props: { onUpload?: (files: File[]) => void }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const onUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    const r = validateFiles(files);

    if (r.result) {
      props.onUpload?.(files);
    } else {
      alert(r.reason);
    }

    e.target.value = '';
  };

  // 許可するファイル形式
  const acceptTypes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'text/plain',
    '.pdf', '.xls', '.xlsx', '.doc', '.docx', '.ppt', '.pptx', '.csv', '.txt',
  ].join(',');

  return (
    <>
      <button
        type="button"
        className={css({ p: '2' })}
        onClick={() => fileInput.current?.click()}
        title="ファイルを添付（画像・PDF・Excel・Word等）"
      >
        <MdAttachFile size={24} color="rgba(0,0,0,.6)" />
      </button>
      <input
        type="file"
        multiple
        accept={acceptTypes}
        ref={fileInput}
        onChange={onUpload}
        className={css({ display: 'none' })}
      />
    </>
  );
};
