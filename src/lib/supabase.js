import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabaseの環境変数が設定されていません。')
}

// アプリ全体で同じ認証セッションを利用するため、クライアントを一度だけ生成する
export const supabase = createClient(supabaseUrl, supabaseKey)
