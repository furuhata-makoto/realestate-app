import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase.js'

const emptyProperty = { name: '', rent: '', area: '', layout: '' }
const cardAccents = ['indigo', 'amber', 'green', 'rose', 'blue', 'purple']

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
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState(emptyProperty)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadProperties = useCallback(async () => {
    setLoading(true)

    // RLSにより、ログイン中のユーザーが登録した物件だけが返される
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, rent, area, layout, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`物件を取得できませんでした: ${error.message}`)
    } else {
      setProperties(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  const resetForm = () => {
    setForm(emptyProperty)
    setEditingId(null)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const values = {
      name: form.name.trim(),
      rent: Number(form.rent),
      area: form.area.trim(),
      layout: form.layout.trim(),
    }

    // 更新時もRLSが所有者を検証するため、他ユーザーの物件は変更できない
    const query = editingId
      ? supabase.from('properties').update(values).eq('id', editingId)
      : supabase.from('properties').insert({ ...values, user_id: user.id })
    const { error } = await query

    if (error) {
      setMessage(`保存できませんでした: ${error.message}`)
    } else {
      setMessage(editingId ? '物件情報を更新しました。' : '物件を登録しました。')
      resetForm()
      await loadProperties()
    }
    setSaving(false)
  }

  const startEditing = (property) => {
    setEditingId(property.id)
    setForm({ name: property.name, rent: String(property.rent), area: property.area, layout: property.layout })
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (property) => {
    if (!window.confirm(`「${property.name}」を削除しますか？`)) return

    setMessage('')
    // RLSにより、自分が登録した物件以外は削除できない
    const { error } = await supabase.from('properties').delete().eq('id', property.id)
    if (error) {
      setMessage(`削除できませんでした: ${error.message}`)
      return
    }
    if (editingId === property.id) resetForm()
    setMessage('物件を削除しました。')
    await loadProperties()
  }

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
        <section className="property-form-panel" aria-labelledby="property-form-title">
          <div className="form-heading">
            <div>
              <span className="eyebrow dark">PROPERTY DETAILS</span>
              <h2 id="property-form-title">{editingId ? '物件を編集' : '新しい物件を登録'}</h2>
            </div>
            {editingId && <button className="text-button" type="button" onClick={resetForm}>編集をキャンセル</button>}
          </div>
          <form className="property-form" onSubmit={handleSave}>
            <div className="field"><label htmlFor="property-name">物件名</label><input id="property-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：リバーサイド代官山" maxLength="100" required /></div>
            <div className="field"><label htmlFor="property-rent">家賃（円）</label><input id="property-rent" type="number" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} placeholder="185000" min="0" step="1" required /></div>
            <div className="field"><label htmlFor="property-area">エリア名</label><input id="property-area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="例：東京都渋谷区" maxLength="100" required /></div>
            <div className="field compact"><label htmlFor="property-layout">間取り</label><input id="property-layout" value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })} placeholder="1LDK" maxLength="30" required /></div>
            <button className="save-button" type="submit" disabled={saving}>{saving ? '保存中...' : editingId ? '更新する' : '登録する'}</button>
          </form>
        </section>

        {message && <p className="dashboard-message" role="status">{message}</p>}
        <div className="page-heading">
          <div><span className="eyebrow dark">PORTFOLIO</span><h1>管理物件</h1><p>現在管理中の物件一覧です。</p></div>
          <div className="property-count"><strong>{properties.length}</strong><span>物件</span></div>
        </div>
        {loading ? (
          <div className="list-state">物件を読み込んでいます...</div>
        ) : properties.length === 0 ? (
          <div className="list-state empty-state"><strong>登録物件はまだありません</strong><span>上のフォームから最初の物件を登録できます。</span></div>
        ) : <section className="property-grid" aria-label="管理物件一覧">
          {properties.map((property, index) => (
            <article className="property-card" key={property.id}>
              <div className={`property-visual ${cardAccents[index % cardAccents.length]}`}><span>{property.layout}</span><div className="building-shape" /></div>
              <div className="property-body">
                <span className="area">⌖ {property.area}</span>
                <h2>{property.name}</h2>
                <div className="rent"><span>月額賃料</span><strong>{property.rent.toLocaleString()}円</strong></div>
                <div className="card-actions">
                  <button type="button" onClick={() => startEditing(property)}>編集</button>
                  <button className="delete-button" type="button" onClick={() => handleDelete(property)}>削除</button>
                </div>
              </div>
            </article>
          ))}
        </section>}
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
