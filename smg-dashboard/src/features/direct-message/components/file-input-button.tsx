'use client';

import { css } from '@/styled-system/css';
import { useRef } from 'react';
import { MdInsertPhoto } from 'react-icons/md';
import { validateImages } from '../lib/image';

export const FileInputBtn = (props: { onUpload?: (files: File[]) => void }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const onUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    const r = validateImages(files);

    if (r.result) {
      props.onUpload?.(files);
    } else {
      alert(r.reason);
    }

    e.target.value = '';
  };
  return (
    <>
      <button
        type="button"
        className={css({ p: '2' })}
        onClick={() => fileInput.current?.click()}
      >
        <MdInsertPhoto size={24} color="rgba(0,0,0,.6)" />
      </button>
      <input
        type="file"
        multiple
        accept="image/png,image/jpeg"
        ref={fileInput}
        onChange={onUpload}
        className={css({ display: 'none' })}
      />
    </>
  );
};
