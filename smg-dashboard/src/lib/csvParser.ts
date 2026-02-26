import type { UserFormData } from '@/components/userlist/types';

export interface CSVUserData {
  氏名: string;
  ふりがな: string;
  メールアドレス: string;
}

export interface ParsedCSVUser {
  userName: string;
  userNameKana: string;
  email: string;
  isValid: boolean;
  error?: string;
}

function detectDelimiter(csvContent: string): string {
  const firstLine = csvContent.trim().split('\n')[0];

  if (firstLine.includes('\t')) {
    return '\t';
  }
  if (firstLine.includes(',')) {
    return ',';
  }

  return ',';
}

export function parseCSVContent(csvContent: string): ParsedCSVUser[] {
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSVファイルにはヘッダー行とデータ行が必要です');
  }

  const delimiter = detectDelimiter(csvContent);
  const header = lines[0].split(delimiter).map((col) => col.trim());
  const expectedHeaders = ['氏名', 'ふりがな', 'メールアドレス'];

  if (!expectedHeaders.every((h) => header.includes(h))) {
    throw new Error(
      `CSVファイルには以下のヘッダーが必要です: ${expectedHeaders.join(', ')}`,
    );
  }

  const results: ParsedCSVUser[] = [];
  const emailSet = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    // 空行や不要な文字（バックスラッシュのみなど）をスキップ
    if (!line || line === '\\' || line.match(/^[\\,\s]*$/)) continue;

    const row = line.split(delimiter).map((col) => col.trim());

    if (row.length < header.length) {
      continue;
    }

    const nameIndex = header.indexOf('氏名');
    const kanaIndex = header.indexOf('ふりがな');
    const emailIndex = header.indexOf('メールアドレス');

    const userName = row[nameIndex] || '';
    const userNameKana = row[kanaIndex] || '';
    const email = row[emailIndex] || '';

    let isValid = true;
    let error = '';

    // メールアドレスの正規化（'-'や空文字を空文字として扱う）
    const normalizedEmail = email === '-' || email === '' ? '' : email;

    if (!userName) {
      isValid = false;
      error = '氏名が入力されていません';
    } else if (!normalizedEmail) {
      isValid = false;
      error = 'メールアドレスが入力されていません';
    } else if (!isValidEmail(normalizedEmail)) {
      isValid = false;
      error = 'メールアドレスの形式が正しくありません';
    } else if (emailSet.has(normalizedEmail)) {
      isValid = false;
      error = 'このメールアドレスは既に使用されています';
    }

    // 有効なメールアドレスの場合はセットに追加
    if (isValid && normalizedEmail) {
      emailSet.add(normalizedEmail);
    }

    results.push({
      userName,
      userNameKana,
      email: normalizedEmail,
      isValid,
      error: isValid ? undefined : error,
    });
  }

  return results;
}

export function convertToUserFormData(parsedUser: ParsedCSVUser): UserFormData {
  return {
    userName: parsedUser.userName,
    userNameKana: parsedUser.userNameKana,
    email: parsedUser.email,
    companyName: null,
    companyNameKana: null,
    password: generateRandomPassword(),
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateRandomPassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
