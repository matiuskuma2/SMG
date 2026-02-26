'use client';
import type {
  ArchiveFile,
  FileUploaderProps,
} from '@/components/archive/archive';
import { css } from '@/styled-system/css';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiFile, FiUpload, FiX } from 'react-icons/fi';

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

// FileItemコンポーネントのProps型定義
interface FileItemProps {
  file: ArchiveFile & {
    file?: File | null;
    fileName?: string;
  };
  index: number;
  onRemove: (index: number) => void;
  onFileChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileNameChange: (index: number, fileName: string) => void;
  onThemeChange: (index: number, themeId: string) => void;
  onSawabeChange: (index: number, checked: boolean) => void;
  themes: Array<{ theme_id: string; theme_name: string }>;
}

// ファイルアイテムをメモ化コンポーネントとして分離
const FileItem = memo(
  ({
    file,
    index,
    onRemove,
    onFileChange,
    onFileNameChange,
    onThemeChange,
    onSawabeChange,
    themes,
  }: FileItemProps) => {
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
              mb: '2',
            })}
          >
            {file.file || file.fileName || file.file_url ? (
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
                    file.fileName ||
                    file.file?.name ||
                    (file.file_url
                      ? file.file_url.split('/').pop() || '既存ファイル'
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
                position: 'relative',
                overflow: 'hidden',
              })}
            >
              <FiUpload size={16} />
              <span>アップロード</span>
              <input
                id={`file-upload-${index}`}
                type="file"
                name={`file-upload-${index}`}
                onChange={(e) => onFileChange(index, e)}
                className={css({
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                })}
                required={!file.file_url && !file.file}
              />
            </label>
          </div>

          {/* ファイル名編集フィールド */}
          {(file.file || file.fileName || file.file_url) && (
            <div className={css({ mb: '2' })}>
              <label
                htmlFor={`file-name-${index}`}
                className={css({ display: 'block', mb: '1', fontSize: 'sm' })}
              >
                表示ファイル名
              </label>
              <FileNameInput
                index={index}
                value={file.file_name ?? file.fileName ?? file.file?.name ?? ''}
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
            value={file.display_order}
          />
        </div>

        {/* テーマ選択・沢辺講師フラグ（定例会の時のみ表示） */}
        {themes.length > 0 && (
          <>
            {/* テーマ選択 */}
            <div className={css({ mt: '3' })}>
              <label
                htmlFor={`file-theme-${index}`}
                className={css({ display: 'block', mb: '1', fontSize: 'sm' })}
              >
                テーマ
              </label>
              <select
                id={`file-theme-${index}`}
                value={file.theme_id || ''}
                onChange={(e) => onThemeChange(index, e.target.value)}
                className={css({
                  w: 'full',
                  p: '2',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  borderRadius: 'md',
                  bg: 'white',
                })}
              >
                <option value="">選択してください</option>
                {themes.map((theme) => (
                  <option key={theme.theme_id} value={theme.theme_id}>
                    {theme.theme_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 沢辺講師フラグ */}
            <div className={css({ mt: '4' })}>
              <label
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                  cursor: 'pointer',
                })}
              >
                <input
                  type="checkbox"
                  checked={file.is_sawabe_instructor || false}
                  onChange={(e) => onSawabeChange(index, e.target.checked)}
                  className={css({ cursor: 'pointer' })}
                />
                <span className={css({ fontSize: 'sm' })}>沢辺講師</span>
              </label>
            </div>
          </>
        )}
      </div>
    );
  },
);

FileItem.displayName = 'FileItem';

// FileUploaderコンポーネントをメモ化
export const FileUploader = memo(
  ({ initialFiles = [], onChange, themes = [] }: FileUploaderProps) => {
    const [files, setFiles] = useState<
      (ArchiveFile & { file?: File | null; fileName?: string })[]
    >([]);
    const filesRef = useRef<
      (ArchiveFile & { file?: File | null; fileName?: string })[]
    >([]);
    const isInitialMount = useRef(true);

    // 初期マウント時にのみinitialFilesを設定
    useEffect(() => {
      if (isInitialMount.current) {
        setFiles(initialFiles);
        filesRef.current = JSON.parse(JSON.stringify(initialFiles));
        isInitialMount.current = false;
      }
    }, [initialFiles]);

    // ファイルリストの変更を親コンポーネントに通知
    useEffect(() => {
      if (!isInitialMount.current) {
        filesRef.current = JSON.parse(JSON.stringify(files));
        onChange(files);
      }
    }, [files, onChange]);

    const handleAddFile = useCallback(() => {
      const newFile: ArchiveFile & { file: File | null; fileName?: string } = {
        file: null,
        file_url: '',
        file_name: null,
        display_order: files.length + 1,
        archive_id: '',
        file_id: '',
        created_at: null,
        updated_at: null,
        deleted_at: null,
        theme_id: null,
        is_sawabe_instructor: false,
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
            fileName: fileList[0].name,
            file_name: fileList[0].name,
            file_url: '', // 新しいファイルを選択したので既存URLをクリア
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
            fileName: fileName,
          };
          return newFiles;
        });
      },
      [],
    );

    const handleThemeChange = useCallback((index: number, themeId: string) => {
      setFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        newFiles[index] = {
          ...newFiles[index],
          theme_id: themeId || null,
        };
        return newFiles;
      });
    }, []);

    const handleSawabeChange = useCallback(
      (index: number, checked: boolean) => {
        setFiles((prevFiles) => {
          const newFiles = [...prevFiles];
          newFiles[index] = {
            ...newFiles[index],
            is_sawabe_instructor: checked,
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
                onThemeChange={handleThemeChange}
                onSawabeChange={handleSawabeChange}
                themes={themes}
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

// displayNameを設定してデバッグを容易に
FileUploader.displayName = 'FileUploader';
