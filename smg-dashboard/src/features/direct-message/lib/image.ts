const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 3;

// 許可するファイル形式
const ALLOWED_TYPES = [
  // 画像
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  // PDF
  'application/pdf',
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // PowerPoint
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // CSV/テキスト
  'text/csv',
  'text/plain',
];

const ALLOWED_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'webp',
  'pdf',
  'xls', 'xlsx',
  'doc', 'docx',
  'ppt', 'pptx',
  'csv', 'txt',
];

export const isImageFile = (file: { name: string; type?: string } | string): boolean => {
  if (typeof file === 'string') {
    // URLから判定
    const ext = file.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  }
  if (file.type) {
    return file.type.startsWith('image/');
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
};

const isValidFile = (
  file: File,
): { result: true } | { result: false; reason: string } => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const isAllowedType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(extension);
  
  if (!isAllowedType)
    return {
      result: false,
      reason: `指定された形式はアップロードできません。\n対応形式: 画像(PNG,JPEG,GIF,WebP), PDF, Excel, Word, PowerPoint, CSV, テキスト`,
    };

  if (file.size > MAX_SIZE)
    return {
      result: false,
      reason: 'ファイルサイズが上限を超えています（上限: 10MB）',
    };

  return { result: true };
};

export const validateFiles = (files: File[]) => {
  let r: ReturnType<typeof isValidFile> = { result: true };

  if (files.length > MAX_FILES)
    return {
      result: false,
      reason: `一度にアップロード可能な上限を超えています（上限: ${MAX_FILES}件）`,
    };

  for (const file of files) {
    r = isValidFile(file);
    if (!r.result) return r;
  }
  return r;
};

// 後方互換性のためエイリアスを維持
export const validateImages = validateFiles;
