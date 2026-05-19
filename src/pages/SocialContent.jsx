import { useState } from 'react'

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'Twitter/X', 'Facebook']
const POST_COUNTS = [3, 5, 7, 10]

const PLATFORM_BADGE = {
  Instagram:  'badge-pink',
  TikTok:     'badge-cyan',
  LinkedIn:   'badge-violet',
  'Twitter/X':'badge-muted',
  Facebook:   'badge-violet',
}

const INITIAL = {
  businessName: '',
  niche: '',
  platform: PLATFORMS[0],
  postCount: POST_COUNTS[1],
  contentTheme: '',
}

function PostCard({ post, index }) {
  const badgeClass = PLATFORM_BADGE[post.platform] || 'badge-muted'
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="flex items-center gap-8" style={{ marginBottom: 14 }}>
        <span className={`badge ${badgeClass}`}>{post.platform || 'Post'}</span>
        {post.postType && <span className="badge badge-violet">{post.postType}</span>}
        <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>#{index + 1}</span>
      </div>

      {post.caption && (
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 12, fontSize: 13.5, lineHeight: 1.75, color: 'var(--text)' }}>
          {post.caption}
        </div>
      )}

      {post.visualConcept && (
        <p style={{ fontSize: 12, color: 'var(--accent3)', fontStyle: 'italic', marginBottom: 10 }}>
          Visual: {post.visualConcept}
        </p>
      )}

      {post.callToAction && (
        <div className="flex items-center gap-8" style={{ marginBottom: 10 }}>
          <span className="badge badge-orange">CTA</span>
          <span style={{ fontSize: 13, color: 'var(--text)' }}>{post.callToAction}</span>
        </div>
      )}

      {post.bestTimeToPost && (
        <div className="flex items-center gap-8" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Best time: {post.bestTimeToPost}</span>
        </div>
      )}

      {post.hashtags && post.hashtags.length > 0 && (
        <div className="tag-row">
          {post.hashtags.map((tag, i) => (
            <span key={i} className="tag">{tag.startsWith('#') ? tag : `#${tag}`}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SocialContent() {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(Array.isArray(data) ? data : data.posts ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Agent 02</div>
        <h1 className="page-title">SOCIAL CONTENT</h1>
        <p className="page-subtitle">
          Generate a batch of ready-to-post content with captions, hashtags, visual concepts, and CTAs.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="businessName">Business Name *</label>
              <input id="businessName" name="businessName" type="text" className="form-input"
                value={form.businessName} onChange={handleChange} required
                placeholder="e.g. Luminary Studio" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="niche">Niche / Industry</label>
              <input id="niche" name="niche" type="text" className="form-input"
                value={form.niche} onChange={handleChange}
                placeholder="e.g. Graphic Design, Branding Agency" />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="platform">Platform</label>
              <select id="platform" name="platform" className="form-select"
                value={form.platform} onChange={handleChange}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="postCount">Number of Posts</label>
              <select id="postCount" name="postCount" className="form-select"
                value={form.postCount} onChange={handleChange}>
                {POST_COUNTS.map(n => <option key={n} value={n}>{n} posts</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contentTheme">Content Theme</label>
            <input id="contentTheme" name="contentTheme" type="text" className="form-input"
              value={form.contentTheme} onChange={handleChange}
              placeholder="e.g. Behind the scenes, Client results, Tips & tricks" />
          </div>

          {error && <div className="inline-error">{error}</div>}

          <button type="submit" className="btn btn-pink" disabled={loading} style={{ marginTop: 8 }}>
            {loading
              ? <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Generating…</>
              : '◉ Generate Content'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48 }}>
          <div className="loading-spinner loading-spinner--lg" />
          <p className="text-muted2">Claude is writing {form.postCount} posts for {form.platform}…</p>
        </div>
      )}

      {result && result.length > 0 && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.03em' }}>
              {result.length} Post{result.length !== 1 ? 's' : ''} Generated
            </h2>
            <span className="badge badge-pink">{form.platform}</span>
          </div>
          <div className="grid-2">
            {result.map((post, i) => <PostCard key={i} post={post} index={i} />)}
          </div>
        </div>
      )}

      {result && result.length === 0 && (
        <div className="inline-notice">No posts returned. Try adjusting your inputs.</div>
      )}
    </div>
  )
}
