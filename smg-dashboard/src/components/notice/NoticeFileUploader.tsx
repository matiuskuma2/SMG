import { css } from '@/styled-system/css';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiFile, FiUpload, FiX } from 'react-icons/fi';
import type { NoticeFile } from './types';

type NoticeFileUploaderProps = {
  initialFiles?: NoticeFile[];
  onChange: (files: NoticeFile[]) => void;
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
    // 内部状態を使用して入力値を管理
    const [inputValue, setInputValue] = useState(value);
    const valueRef = useRef(value);

    // 外部から値が変更された場合に内部状態を更新
    useEffect(() => {
      if (value !== valueRef.current) {
        setInputValue(value);
        valueRef.current = value;
      }
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        // 内部状態を即時更新（入力の応答性を保つ）
        setInputValue(newValue);
        // 参照値も更新
        valueRef.current = newValue;
        // 親コンポーネントにも即時通知
        onChange(index, newValue);
      },
      [index, onChange],
    );

    return (
      <input
        id={`notice-file-name-${index}`}
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
    file: NoticeFile;
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
            htmlFor={`notice-file-upload-${index}`}
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
            {file.file || file.file_name ? (
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
                  {file.file_name || file.file?.name}
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
              htmlFor={`notice-file-upload-${index}`}
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
              id={`notice-file-upload-${index}`}
              type="file"
              name={`notice-file-upload-${index}`}
              onChange={(e) => onFileChange(index, e)}
              className={css({ display: 'none' })}
              required={!file.file_url && !file.file}
            />
          </div>

          {/* ファイル名編集フィールド */}
          {(file.file || file.file_name || file.file_url) && (
            <div className={css({ mb: '2' })}>
              <label
                htmlFor={`notice-file-name-${index}`}
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
            name={`notice-file-id-${index}`}
            value={file.file_id || ''}
          />
          <input
            type="hidden"
            name={`notice-file-url-${index}`}
            value={file.file_url || ''}
          />
          <input
            type="hidden"
            name={`notice-file-name-${index}`}
            value={file.file_name || ''}
          />
          <input
            type="hidden"
            name={`notice-file-display-order-${index}`}
            value={file.display_order ?? 0}
          />
        </div>
      </div>
    );
  },
);

FileItem.displayName = 'FileItem';

// NoticeFileUploaderコンポーネントをメモ化
export const NoticeFileUploader = memo(
  ({ initialFiles = [], onChange }: NoticeFileUploaderProps) => {
    console.log('NoticeFileUploader - レンダリング');
    const [files, setFiles] = useState<NoticeFile[]>([]);
    const filesRef = useRef<NoticeFile[]>([]);
    const isInitialMount = useRef(true);

    // 初期マウント時にのみinitialFilesを設定
    useEffect(() => {
      if (isInitialMount.current) {
        console.log(
          'NoticeFileUploader - 初期マウント - 初期ファイル:',
          initialFiles,
        );
        setFiles(initialFiles);
        filesRef.current = JSON.parse(JSON.stringify(initialFiles));
        isInitialMount.current = false;
      }
    }, [initialFiles]);

    // ファイルリストの変更を親コンポーネントに通知
    useEffect(() => {
      if (!isInitialMount.current) {
        console.log('NoticeFileUploader - ファイルリスト更新:', files);
        filesRef.current = JSON.parse(JSON.stringify(files));
        onChange(files);
      }
    }, [files, onChange]);

    const handleAddFile = useCallback(() => {
      console.log('NoticeFileUploader - ファイル追加ボタンクリック');
      const newFile: NoticeFile = {
        file: null,
        file_name: null,
        file_url: '',
        display_order: files.length + 1,
        file_id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        created_at: null,
        deleted_at: null,
        notice_id: '',
        updated_at: null,
      };
      console.log('NoticeFileUploader - 新しいファイル:', newFile);
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, newFile];
        console.log(
          'NoticeFileUploader - 更新後のファイルリスト:',
          updatedFiles,
        );
        return updatedFiles;
      });
    }, [files.length]);

    const handleRemoveFile = useCallback((index: number) => {
      console.log(`NoticeFileUploader - ファイル削除[${index}]`);
      setFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        newFiles.splice(index, 1);
        const updatedFiles = newFiles.map((file, idx) => ({
          ...file,
          display_order: idx + 1,
        }));
        console.log(
          'NoticeFileUploader - 更新後のファイルリスト:',
          updatedFiles,
        );
        return updatedFiles;
      });
    }, []);

    const handleFileChange = useCallback(
      (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        console.log(
          `NoticeFileUploader - ファイル変更[${index}] - ファイル名:`,
          fileList[0].name,
        );
        setFiles((prevFiles) => {
          const newFiles = [...prevFiles];
          newFiles[index] = {
            ...newFiles[index],
            file: fileList[0],
            file_name: fileList[0].name,
          };
          console.log('NoticeFileUploader - 更新後のファイルリスト:', newFiles);
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
      <div className={css({ mt: '4' })}>
        <h3
          className={css({
            fontSize: 'md',
            fontWeight: 'bold',
            mb: '2',
          })}
        >
          お知らせ資料
        </h3>

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

// displayNameを設定してデバッグを容易に
NoticeFileUploader.displayName = 'NoticeFileUploader';
