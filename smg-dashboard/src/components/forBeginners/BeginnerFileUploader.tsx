'use client';

import { css } from '@/styled-system/css';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiFile, FiUpload, FiX } from 'react-icons/fi';
import type { BeginnerGuideFile } from './types';

type BeginnerFileUploaderProps = {
  initialFiles?: BeginnerGuideFile[];
  onChange: (files: BeginnerGuideFile[]) => void;
};

// ファイル名入力フィールドをメモ化コンポーネントとして分離
const FileNameInput = memo(
  ({
    index,
    value,
    onChange,
  }: {
    index: number;
    value: string;
    onChange: (index: number, fileName: string) => void;
  }) => {
    const [inputValue, setInputValue] = useState(value);
    const valueRef = useRef(value);

    useEffect(() => {
      if (value !== valueRef.current) {
        setInputValue(value);
        valueRef.current = value;
      }
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        valueRef.current = newValue;
        onChange(index, newValue);
      },
      [index, onChange],
    );

    return (
      <input
        id={`beginner-file-name-${index}`}
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="ファイル名を入力"
        className={css({
          w: 'full',
          p: '2',
          border: '1px solid',
          borderColor: 'gray.300',
          borderRadius: 'md',
          fontSize: 'sm',
        })}
      />
    );
  },
);

FileNameInput.displayName = 'FileNameInput';

// ファイルアイテムをメモ化コンポーネントとして分離
const FileItem = memo(
  ({
    file,
    index,
    onRemove,
    onFileChange,
    onFileNameChange,
  }: {
    file: BeginnerGuideFile;
    index: number;
    onRemove: (index: number) => void;
    onFileChange: (
      index: number,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => void;
    onFileNameChange: (index: number, fileName: string) => void;
  }) => {
    return (
      <div
        className={css({
          border: '1px solid',
          borderColor: 'gray.200',
          p: '4',
          mb: '2',
          borderRadius: 'md',
          bg: 'white',
        })}
      >
        <div
          className={css({
            display: 'flex',
            justifyContent: 'space-between',
            mb: '2',
          })}
        >
          <span className={css({ fontWeight: 'medium' })}>
            資料 #{index + 1}
          </span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className={css({
              color: 'red.500',
              _hover: { color: 'red.600' },
            })}
          >
            <FiX />
          </button>
        </div>

        <div>
          <label
            htmlFor={`beginner-file-upload-${index}`}
            className={css({ display: 'block', mb: '1' })}
          >
            ファイル <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '2',
            })}
          >
            {file.file || file.file_name || file.file_path ? (
              <div
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                  p: '2',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  borderRadius: 'md',
                  bg: 'gray.50',
                  flex: '1',
                })}
              >
                <FiFile />
                <span className={css({ fontSize: 'sm' })}>
                  {file.file_name ||
                    file.file?.name ||
                    (file.file_path
                      ? file.file_path.split('/').pop() || '既存ファイル'
                      : '')}
                </span>
              </div>
            ) : (
              <div
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: '2',
                  border: '1px dashed',
                  borderColor: 'gray.300',
                  borderRadius: 'md',
                  color: 'gray.500',
                  flex: '1',
                })}
              >
                ファイルが選択されていません
              </div>
            )}
            <label
              htmlFor={`beginner-file-upload-${index}`}
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '1',
                bg: 'blue.500',
                color: 'white',
                p: '2',
                borderRadius: 'md',
                cursor: 'pointer',
                _hover: { bg: 'blue.600' },
                fontSize: 'sm',
              })}
            >
              <FiUpload size={16} />
              <span>アップロード</span>
            </label>
            <input
              id={`beginner-file-upload-${index}`}
              type="file"
              name={`beginner-file-upload-${index}`}
              onChange={(e) => onFileChange(index, e)}
              className={css({ display: 'none' })}
              required={!file.file_path && !file.file}
            />
          </div>

          {/* ファイル名編集フィールド */}
          {(file.file || file.file_name || file.file_path) && (
            <div className={css({ mb: '2' })}>
              <label
                htmlFor={`beginner-file-name-${index}`}
                className={css({ display: 'block', mb: '1', fontSize: 'sm' })}
              >
                表示ファイル名
              </label>
              <FileNameInput
                index={index}
                value={file.file_name ?? file.file?.name ?? ''}
                onChange={onFileNameChange}
              />
            </div>
          )}

          <input
            type="hidden"
            name={`beginner-file-id-${index}`}
            value={file.file_id || ''}
          />
          <input
            type="hidden"
            name={`beginner-file-path-${index}`}
            value={file.file_path || ''}
          />
          <input
            type="hidden"
            name={`beginner-file-display-order-${index}`}
            value={file.display_order ?? 0}
          />
        </div>
      </div>
    );
  },
);

FileItem.displayName = 'FileItem';

export const BeginnerFileUploader = memo(
  ({ initialFiles = [], onChange }: BeginnerFileUploaderProps) => {
    const [files, setFiles] = useState<BeginnerGuideFile[]>([]);
    const filesRef = useRef<BeginnerGuideFile[]>([]);
    const isInitialMount = useRef(true);

    useEffect(() => {
      if (isInitialMount.current) {
        setFiles(initialFiles);
        filesRef.current = JSON.parse(JSON.stringify(initialFiles));
        isInitialMount.current = false;
      }
    }, [initialFiles]);

    useEffect(() => {
      if (!isInitialMount.current) {
        filesRef.current = JSON.parse(JSON.stringify(files));
        onChange(files);
      }
    }, [files, onChange]);

    const handleAddFile = useCallback(() => {
      const newFile: BeginnerGuideFile = {
        file: null,
        file_id: '',
        guide_item_id: '',
        file_path: '',
        file_name: null,
        display_order: files.length + 1,
        created_at: null,
        updated_at: null,
        deleted_at: null,
      };
      setFiles((prevFiles) => [...prevFiles, newFile]);
    }, [files.length]);

    const handleRemoveFile = useCallback((index: number) => {
      setFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        newFiles.splice(index, 1);
        return newFiles.map((file, idx) => ({
          ...file,
          display_order: idx + 1,
        }));
      });
    }, []);

    const handleFileChange = useCallback(
      (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        setFiles((prevFiles) => {
          const newFiles = [...prevFiles];
          newFiles[index] = {
            ...newFiles[index],
            file: fileList[0],
            file_name: fileList[0].name,
            file_path: '',
            display_order: index + 1,
          };
          return newFiles;
        });
      },
      [],
    );

    const handleFileNameChange = useCallback(
      (index: number, fileName: string) => {
        setFiles((prevFiles) => {
          const newFiles = [...prevFiles];
          newFiles[index] = {
            ...newFiles[index],
            file_name: fileName,
          };
          return newFiles;
        });
      },
      [],
    );

    return (
      <div
        className={css({
          bg: 'white',
          p: '6',
          rounded: 'md',
        })}
      >
        <div
          className={css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: '4',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            pb: '2',
          })}
        >
          <h2
            className={css({
              fontSize: 'xl',
              fontWeight: 'bold',
            })}
          >
            資料ファイル
          </h2>
        </div>

        {files.length === 0 ? (
          <div
            className={css({ textAlign: 'center', p: '4', color: 'gray.500' })}
          >
            ファイルがありません。「資料を追加」ボタンをクリックしてファイルを追加してください。
          </div>
        ) : (
          <div className={css({ mb: '4' })}>
            {files.map((file, index) => (
              <FileItem
                key={file.file_id || `temp-${index}`}
                file={file}
                index={index}
                onRemove={handleRemoveFile}
                onFileChange={handleFileChange}
                onFileNameChange={handleFileNameChange}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddFile}
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '1',
            bg: 'blue.500',
            color: 'white',
            p: '2',
            px: '3',
            borderRadius: 'md',
            _hover: { bg: 'blue.600' },
            fontSize: 'sm',
            fontWeight: 'medium',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            width: 'fit-content',
            margin: '0 auto',
          })}
        >
          <FiUpload size={16} />
          <span>資料を追加</span>
        </button>
      </div>
    );
  },
);

BeginnerFileUploader.displayName = 'BeginnerFileUploader';
