import { css } from '@/styled-system/css';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiFile, FiUpload, FiX } from 'react-icons/fi';
import type { EventFile } from './types';

type EventFileUploaderProps = {
  initialFiles?: EventFile[];
  onChange: (files: EventFile[]) => void;
};

// 入力フィールドをメモ化コンポーネントとして分離
const FileDescriptionInput = memo(
  ({
    index,
    value,
    onChange,
  }: {
    index: number;
    value: string;
    onChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => {
    console.log(
      `FileDescriptionInput[${index}] - レンダリング - 現在の値:`,
      value,
    );

    // 内部状態を使用して入力値を管理
    const [inputValue, setInputValue] = useState(value);
    const valueRef = useRef(value);

    // 外部から値が変更された場合に内部状態を更新
    useEffect(() => {
      if (value !== valueRef.current) {
        console.log(
          `FileDescriptionInput[${index}] - 外部からの値更新:`,
          value,
        );
        setInputValue(value);
        valueRef.current = value;
      }
    }, [index, value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        console.log(
          `FileDescriptionInput[${index}] - 入力変更 - 新しい値:`,
          newValue,
        );

        // 内部状態を即時更新（入力の応答性を保つ）
        setInputValue(newValue);

        // 参照値も更新
        valueRef.current = newValue;

        // 親コンポーネントにも即時通知
        onChange(index, e);
      },
      [index, onChange],
    );

    return (
      <input
        id={`file-description-${index}`}
        type="text"
        value={inputValue}
        onChange={handleChange}
        required
        className={css({
          border: '1px solid',
          borderColor: 'gray.300',
          p: '2',
          borderRadius: 'md',
          width: '100%',
          _focus: {
            outline: 'none',
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px var(--colors-blue-500)',
          },
        })}
        placeholder="例: 参加申込書"
      />
    );
  },
);

FileDescriptionInput.displayName = 'FileDescriptionInput';

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
        id={`file-name-${index}`}
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="ファイル名を入力"
        className={css({
          border: '1px solid',
          borderColor: 'gray.300',
          p: '2',
          borderRadius: 'md',
          width: '100%',
          _focus: {
            outline: 'none',
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px var(--colors-blue-500)',
          },
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
    onDescriptionChange,
    onFileNameChange,
  }: {
    file: EventFile;
    index: number;
    onRemove: (index: number) => void;
    onFileChange: (
      index: number,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => void;
    onDescriptionChange: (
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

        <div className={css({ mb: '3' })}>
          <label
            htmlFor={`file-description-${index}`}
            className={css({ display: 'block', mb: '1' })}
          >
            ファイルの説明 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <FileDescriptionInput
            index={index}
            value={file.file_description || ''}
            onChange={onDescriptionChange}
          />
        </div>

        <div>
          <label
            htmlFor={`file-upload-${index}`}
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
              htmlFor={`file-upload-${index}`}
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
              id={`file-upload-${index}`}
              type="file"
              name={`file-upload-${index}`}
              onChange={(e) => onFileChange(index, e)}
              className={css({ display: 'none' })}
              required={!file.file_url && !file.file}
            />
          </div>

          {/* ファイル名編集フィールド */}
          {(file.file || file.file_name || file.file_url) && (
            <div className={css({ mt: '2' })}>
              <label
                htmlFor={`file-name-${index}`}
                className={css({ display: 'block', mb: '1' })}
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
            name={`file-id-${index}`}
            value={file.file_id || ''}
          />
          <input
            type="hidden"
            name={`file-url-${index}`}
            value={file.file_url || ''}
          />
          <input
            type="hidden"
            name={`file-display-order-${index}`}
            value={file.display_order ?? 0}
          />
        </div>
      </div>
    );
  },
);

FileItem.displayName = 'FileItem';

// EventFileUploaderコンポーネントをメモ化
export const EventFileUploader = memo(
  ({ initialFiles = [], onChange }: EventFileUploaderProps) => {
    console.log('EventFileUploader - レンダリング');
    const [files, setFiles] = useState<EventFile[]>([]);
    const filesRef = useRef<EventFile[]>([]);
    const isInitialMount = useRef(true);

    // 初期マウント時にのみinitialFilesを設定
    useEffect(() => {
      if (isInitialMount.current) {
        console.log(
          'EventFileUploader - 初期マウント - 初期ファイル:',
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
        console.log('EventFileUploader - ファイルリスト更新:', files);
        filesRef.current = JSON.parse(JSON.stringify(files));
        onChange(files);
      }
    }, [files, onChange]);

    const handleAddFile = useCallback(() => {
      console.log('EventFileUploader - ファイル追加ボタンクリック');
      const newFile: EventFile = {
        file: null,
        file_description: '',
        display_order: files.length + 1,
        file_id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file_name: null,
        file_url: '',
        created_at: null,
        deleted_at: null,
        event_id: '',
        updated_at: null,
      };
      console.log('EventFileUploader - 新しいファイル:', newFile);
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, newFile];
        console.log(
          'EventFileUploader - 更新後のファイルリスト:',
          updatedFiles,
        );
        return updatedFiles;
      });
    }, [files.length]);

    const handleRemoveFile = useCallback((index: number) => {
      console.log(`EventFileUploader - ファイル削除[${index}]`);
      setFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        newFiles.splice(index, 1);
        const updatedFiles = newFiles.map((file, idx) => ({
          ...file,
          displayOrder: idx + 1,
        }));
        console.log(
          'EventFileUploader - 更新後のファイルリスト:',
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
          `EventFileUploader - ファイル変更[${index}] - ファイル名:`,
          fileList[0].name,
        );
        setFiles((prevFiles) => {
          const newFiles = [...prevFiles];
          newFiles[index] = {
            ...newFiles[index],
            file: fileList[0],
            file_name: fileList[0].name,
          };
          console.log('EventFileUploader - 更新後のファイルリスト:', newFiles);
          return newFiles;
        });
      },
      [],
    );

    const handleDescriptionChange = useCallback(
      (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(
          `EventFileUploader - 説明変更[${index}] - 新しい値:`,
          e.target.value,
        );
        const value = e.target.value;
        setFiles((prevFiles) => {
          console.log('EventFileUploader - 前のファイルリスト:', prevFiles);
          const newFiles = [...prevFiles];
          // インデックスが有効範囲内かチェック
          if (index >= 0 && index < newFiles.length) {
            newFiles[index] = {
              ...newFiles[index],
              file_description: value,
            };
          }
          console.log('EventFileUploader - 更新後のファイルリスト:', newFiles);
          return newFiles;
        });
      },
      [],
    );

    const handleFileNameChange = useCallback(
      (index: number, fileName: string) => {
        setFiles((prevFiles) => {
          const newFiles = [...prevFiles];
          if (index >= 0 && index < newFiles.length) {
            newFiles[index] = {
              ...newFiles[index],
              file_name: fileName,
            };
          }
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
          イベント資料
        </h3>

        <div className={css({ mb: '4' })}>
          {files.map((file, index) => (
            <FileItem
              key={file.file_id || `temp-${index}`}
              file={file}
              index={index}
              onRemove={handleRemoveFile}
              onFileChange={handleFileChange}
              onDescriptionChange={handleDescriptionChange}
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
EventFileUploader.displayName = 'EventFileUploader';
