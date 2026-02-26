'use server';

import { revalidatePath } from 'next/cache';

/**
 * 指定したパスのキャッシュを再検証する Server Action
 * 編集ページで保存完了後に呼び出すことで、一覧ページや編集ページのキャッシュを無効化する
 */
export async function revalidatePathAction(path: string) {
  revalidatePath(path);
}

/**
 * 複数のパスのキャッシュを再検証する Server Action
 */
export async function revalidatePathsAction(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

// 各機能別のrevalidate関数

/** アーカイブ関連のキャッシュを再検証 */
export async function revalidateArchive() {
  revalidatePath('/archive');
  revalidatePath('/archive/edit');
  revalidatePath('/event/archive');
}

/** ラジオ関連のキャッシュを再検証 */
export async function revalidateRadio() {
  revalidatePath('/radiolist');
  revalidatePath('/radio/edit');
}

/** ユーザー関連のキャッシュを再検証 */
export async function revalidateUser() {
  revalidatePath('/userlist');
  revalidatePath('/user/edit');
}

/** 個別相談関連のキャッシュを再検証 */
export async function revalidateIndividualConsultation() {
  revalidatePath('/individualConsultationlist');
  revalidatePath('/individualConsultation/edit');
}

/** はじめての方へ関連のキャッシュを再検証 */
export async function revalidateForBeginners() {
  revalidatePath('/forBeginnerslist');
  revalidatePath('/forBeginners/edit');
}

/** 質問関連のキャッシュを再検証 */
export async function revalidateQuestion() {
  revalidatePath('/questionlist');
}
