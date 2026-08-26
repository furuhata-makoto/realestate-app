import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase.js'

const properties = [
  { id: 1, name: 'リバーサイド代官山', rent: '185,000円', area: '東京都渋谷区', type: '1LDK', accent: 'indigo' },
  { id: 2, name: 'メゾン神楽坂', rent: '142,000円', area: '東京都新宿区', type: '1DK', accent: 'amber' },
  { id: 3, name: 'パークレジデンス横浜', rent: '128,000円', area: '神奈川県横浜市', type: '2LDK', accent: 'green' },
  { id: 4, name: 'スカイコート吉祥寺', rent: '96,000円', area: '東京都武蔵野市', type: '1K', accent: 'rose' },
  { id: 5, name: 'ベイフロント豊洲', rent: '210,000円', area: '東京都江東区', type: '2LDK', accent: 'blue' },
  { id: 6, name: 'グリーンヒルズ鎌倉', rent: '165,000円', area: '神奈川県鎌倉市', type: '2LDK', accent: 'purple' },
]

function AuthPage({ mode }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const isLogin = mode === 'login'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const result = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    setLoading(false)
    if (result.error) {
      setMessage(result.error.message)
      return
    }

    // メール確認が有効な場合は、確認完了後にログインしてもらう
    if (!isLogin && !result.data.session) {
      setMessage('確認メールを送信しました。メール内のリンクから登録を完了してください。')
      return
    }
    navigate('/properties', { replace: true })
  }

  return (
    <main className="auth-layout">
      <section className="brand-panel">
        <div className="brand-mark">EF</div>
        <div className="brand-copy">
          <span className="eyebrow">PROPERTY MANAGEMENT</span>
          <h1>暮らしの価値を、<br />スマートに管理。</h1>
          <p>物件情報をひとつの場所に。日々の管理をもっとシンプルに、心地よく。</p>
        </div>
        <p className="copyright">© 2026 Estate Flow</p>
      </section>

      <section className="form-panel">
        <div className="form-wrap">
          <div className="mobile-brand">Estate Flow</div>
          <span className="step-label">WELCOME</span>
          <h2>{isLogin ? 'おかえりなさい' : 'アカウントを作成'}</h2>
          <p className="form-intro">{isLogin ? '登録したメールアドレスでログインしてください。' : 'メールアドレスとパスワードを入力してください。'}</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">メールアドレス</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" required />
            <label htmlFor="password">パスワード</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8文字以上" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength="6" required />
            {message && <p className="form-message" role="status">{message}</p>}
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? '処理中...' : isLogin ? 'ログイン' : '無料で登録する'}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="switch-auth">
            {isLogin ? 'アカウントをお持ちでない方' : 'すでにアカウントをお持ちの方'}
            <button type="button" onClick={() => navigate(isLogin ? '/signup' : '/login')}>
              {isLogin ? '会員登録' : 'ログイン'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

function PropertiesPage({ user }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <a className="dashboard-logo" href="/properties"><span>EF</span> Estate Flow</a>
        <div className="account-area">
          <span className="user-email">{user.email}</span>
          <button className="logout-button" type="button" onClick={handleLogout}>ログアウト</button>
        </div>
      </header>
      <main className="content">
        <div className="page-heading">
          <div><span className="eyebrow dark">PORTFOLIO</span><h1>管理物件</h1><p>現在管理中の物件一覧です。</p></div>
          <div className="property-count"><strong>{properties.length}</strong><span>物件</span></div>
        </div>
        <section className="property-grid" aria-label="管理物件一覧">
          {properties.map((property) => (
            <article className="property-card" key={property.id}>
              <div className={`property-visual ${property.accent}`}><span>{property.type}</span><div className="building-shape" /></div>
              <div className="property-body">
                <span className="area">⌖ {property.area}</span>
                <h2>{property.name}</h2>
                <div className="rent"><span>月額賃料</span><strong>{property.rent}</strong></div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })

    // ログイン・ログアウトを即座に画面へ反映する
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setChecking(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (checking) return <div className="loading-screen">Estate Flow</div>

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/properties" replace /> : <AuthPage mode="login" />} />
      <Route path="/signup" element={session ? <Navigate to="/properties" replace /> : <AuthPage mode="signup" />} />
      <Route path="/properties" element={session ? <PropertiesPage user={session.user} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={session ? '/properties' : '/login'} replace />} />
    </Routes>
  )
}

export default App
