import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 管理者API用のクライアント
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabaseの環境変数が設定されていません');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          cache: 'no-store',
        });
      },
    },
  });
}
