export default function Footer() {
  return (
    <footer
      style={{
        textAlign: 'center',
        padding: '2rem 1.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6875rem',
        color: 'var(--c-text-4)',
        display: 'flex',
        gap: '1.25rem',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span>© 2026 Plura</span>
      <span style={{ opacity: 0.4 }}>·</span>
      <a href="#" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>
        Termos
      </a>
      <span style={{ opacity: 0.4 }}>·</span>
      <a href="#" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>
        Privacidade
      </a>
    </footer>
  )
}
