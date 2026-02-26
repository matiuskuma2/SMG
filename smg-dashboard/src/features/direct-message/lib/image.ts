const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 3;

const isValidImage = (
  file: File,
): { result: true } | { result: false; reason: string } => {
  const isImageType = new RegExp(/image\/(png|jpeg)/).test(file.type);
  if (!isImageType)
    return {
      result: false,
      reason: '指定された形式はアップロードできません',
    };

  if (file.size > MAX_SIZE)
    return {
      result: false,
      reason: 'ファイルサイズが上限を超えています（上限: 1MB）',
    };

  return { result: true };
};

export const validateImages = (files: File[]) => {
  let r: ReturnType<typeof isValidImage> = { result: true };

  if (files.length > MAX_FILES)
    return {
      result: false,
      reason: '一度にアップロード可能な上限を超えています（上限: 3枚）',
    };

  for (const file of files) {
    r = isValidImage(file);
    if (!r.result) return r;
  }
  return r;
};
