import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="wrap notfound">
      <p className="label">404</p>
      <h1 className="h1" style={{ marginBottom: 18 }}>
        This page has moved on.
      </h1>
      <p className="lede" style={{ margin: '0 auto 30px' }}>
        The page you were looking for is not here. Try the university directory, or start from the home page.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link className="btn btn--fg" href="/">
          Home
        </Link>
        <Link className="btn btn--ghost" href="/universities">
          Universities
        </Link>
        <Link className="btn btn--ghost" href="/scholarships">
          Scholarships
        </Link>
      </div>
    </main>
  )
}
