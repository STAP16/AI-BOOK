import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { compileDocument, documents, findDocument, firstDocument, parts } from './content'
import './styles.css'
import './reader-layout.css'

const Icon = ({ name, size = 20, stroke = 1.8 }) => {
  const paths = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 5.5v15M20 18H6.5A2.5 2.5 0 0 0 4 20.5M8 7h8M8 11h8"/></>,
    search: <><circle cx="11" cy="11" r="6.8"/><path d="m16.2 16.2 4.3 4.3"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon: <><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"/></>,
    github: <path fill="currentColor" stroke="none" d="M12 .297a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.26c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .297"/>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    arrowLeft: <><path d="M19 12H5M11 18l-6-6 6-6"/></>,
    chevron: <path d="m7 9 5 5 5-5"/>,
    check: <path d="m6 12 4 4 8-9"/>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></>,
    spark: <><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6z"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7z"/>,
    bookmark: <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4z"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function navigate(id) {
  window.location.hash = id ? `read/${encodeURIComponent(id)}` : ''
}

const LAST_DOCUMENT_KEY = 'reading-document'

function useRoute() {
  const getRoute = () => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return null
    if (!hash.startsWith('read/')) return undefined
    const value = hash.replace(/^read\//, '')
    try { return decodeURIComponent(value) } catch { return value }
  }
  const [route, setRoute] = useState(getRoute)
  useEffect(() => {
    const handler = () => { const next = getRoute(); if (next !== undefined) setRoute(next) }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return route ? findDocument(route) : null
}

function Logo() {
  return <div className="brand-mark" aria-label="AI Engineer">
    <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
    <span className="brand-ai">AI</span>
  </div>
}

function Header({ progress, onSearch, dark, setDark }) {
  return <header className="topbar">
    <button className="brand" onClick={() => navigate()} aria-label="На главную"><Logo /><span><strong>AI ENGINEER</strong><small>Руководство по созданию AI-систем</small></span></button>
    <button className="search-trigger" onClick={onSearch}><Icon name="search" size={18} /><span>Поиск по книге...</span><kbd>⌘ K</kbd></button>
    <div className="top-actions">
      <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Переключить тему"><Icon name={dark ? 'sun' : 'moon'} size={19} /></button>
      <span className="divider" />
      <button className="text-button about-button" onClick={() => navigate()}><Icon name="book" size={19} /> <span>О книге</span></button>
      <a className="text-button" href="https://github.com/STAP16/AI-BOOK" target="_blank" rel="noreferrer"><Icon name="github" size={20} /> <span>GitHub</span></a>
      <span className="divider" />
      <div className="progress"><span>Прогресс чтения</span><div><i style={{ width: `${progress}%` }} /></div></div><strong className="progress-number">{progress}%</strong>
    </div>
  </header>
}

function SearchModal({ close }) {
  const [query, setQuery] = useState('')
  const result = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return documents.slice(0, 6)
    return documents.filter((document) => `${document.title} ${document.excerpt} ${document.part.title}`.toLowerCase().includes(normalized)).slice(0, 12)
  }, [query])
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <div className="search-modal">
      <div className="modal-search"><Icon name="search" size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти главу, тему или понятие..." /><kbd>ESC</kbd></div>
      <div className="search-results">{result.length ? result.map((document) => <button key={document.id} onClick={() => { navigate(document.id); close() }}><span className={`result-dot ${document.part.accent}`} /><span><small>ЧАСТЬ {document.part.number} · {document.part.title}</small><strong>{document.title}</strong></span><Icon name="arrow" size={17} /></button>) : <p className="empty-search">Ничего не найдено. Попробуйте другой запрос.</p>}</div>
    </div>
  </div>
}

function Sidebar({ current, close }) {
  return <aside className="sidebar">
    <button className="mobile-close" onClick={close}><Icon name="close" /></button>
    <button className={`intro-link ${!current ? 'active' : ''}`} onClick={() => { navigate(); close() }}><span className="home-icon">⌂</span> ВВЕДЕНИЕ</button>
    <div className="side-scroll">
      {parts.map((part) => <section className="part-nav" key={part.folder}>
        <div className="part-heading"><span>ЧАСТЬ {part.number}</span><strong>{part.title}</strong><Icon name="chevron" size={16} /></div>
        <div className="chapter-list">{part.documents.map((document) => <button className={current?.id === document.id ? 'current' : ''} key={document.id} onClick={() => { navigate(document.id); close() }}><span>{document.isTask ? '↳' : document.order === 0 || document.order === 99 ? '•' : `${document.order}.`}</span><label>{document.title.replace(/^Часть (?:I|II|III|IV)\.\s*/i, '')}</label></button>)}</div>
      </section>)}
    </div>
  </aside>
}

function Home({ onStart, hasResume, progress }) {
  return <main className="home-page">
    <section className="hero container">
      <div className="hero-copy"><span className="eyebrow">ДОБРО ПОЖАЛОВАТЬ</span><h1>AI-инженерия:<br />от понимания к созданию<br />собственных систем</h1><p>Практическое руководство для тех, кто хочет не просто использовать AI, а понимать его устройство и создавать умные, надёжные и полезные AI-системы.</p><div className="hero-actions"><button className="primary-button" onClick={onStart}><Icon name="book" size={19} /> {hasResume || progress ? 'Продолжить чтение' : 'Начать читать'}</button><button className="secondary-button" onClick={() => navigate(firstDocument.id)}><span className="play">▷</span> Открыть содержание</button></div><div className="hero-meta"><span><Icon name="clock" size={18} /> Около 12 часов чтения</span><b>•</b><span>{parts.length} частей</span><b>•</b><span>{documents.length} глав</span></div></div>
      <div className="hero-art" aria-label="Обложка книги"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="node node-a" /><div className="node node-b" /><div className="node node-c" /><div className="book-illustration"><div className="book-cover"><div className="cover-mark"><Logo /></div><strong>AI ENGINEER</strong><span>Руководство<br />по созданию AI-систем</span></div><div className="book-pages" /></div><span className="code-orbit">&lt;/&gt;</span><span className="brain-orbit">◌</span></div>
    </section>
    <footer className="home-footer container"><div className="footer-brand"><Logo /><strong>AI ENGINEER</strong></div><span>Практическое руководство по созданию AI-систем</span><small>© 2026 AI Engineer · Котоман Степан</small></footer>
  </main>
}

function Reader({ document, onMenu }) {
  const [Component, setComponent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeHeading, setActiveHeading] = useState(document.headings[0]?.id || '')
  useEffect(() => { let alive = true; setLoading(true); setError(null); compileDocument(document).then((component) => { if (alive) { setComponent(() => component); setLoading(false) } }).catch((reason) => { if (alive) { setError(reason); setLoading(false) } }); return () => { alive = false } }, [document])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [document])
  useEffect(() => {
    setActiveHeading(document.headings[0]?.id || '')
    const elements = [...window.document.querySelectorAll('.mdx-content h2[id], .mdx-content h3[id], .mdx-content h4[id]')]
    if (!elements.length) return undefined
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setActiveHeading(visible[0].target.id)
    }, { rootMargin: '-15% 0px -65% 0px', threshold: [0, 1] })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [document, Component])
  const index = documents.findIndex((item) => item.id === document.id)
  const previous = documents[index - 1]
  const next = documents[index + 1]
  return <div className="reader-page"><Sidebar current={document} close={onMenu} /><div className="reader-layout"><div className="mobile-reader-bar"><button onClick={onMenu}><Icon name="menu" /></button><span>ЧАСТЬ {document.part.number} · {document.part.title}</span></div><main className="reader-main"><div className="breadcrumbs"><span>Часть {document.part.number}</span><b>›</b><span>{document.isTask ? 'Практика' : document.title.replace(/^Часть (?:I|II|III|IV)\.\s*/i, '')}</span></div><div className="reader-heading"><span className={`chapter-pill ${document.part.accent}`}>Часть {document.part.number}</span><h1>{document.title}</h1></div>{loading ? <div className="loading-content"><span className="spinner" /> Загружаем главу…</div> : error ? <div className="load-error"><strong>Не удалось открыть статью</strong><p>{error.message || 'Ошибка MDX-парсера'}</p><button className="secondary-button" onClick={() => window.location.reload()}>Повторить</button></div> : <article className="mdx-content">{Component && <Component />}</article>}<div className="reader-footer"><button disabled={!previous} onClick={() => previous && navigate(previous.id)}><Icon name="arrowLeft" size={18} /><span><small>Предыдущая</small><strong>{previous?.title || 'Это первая глава'}</strong></span></button><button disabled={!next} onClick={() => next && navigate(next.id)}><span><small>Следующая глава</small><strong>{next?.title || 'Конец книги'}</strong></span><Icon name="arrow" size={18} /></button></div></main><aside className="toc"><div className="toc-title">В ЭТОЙ ГЛАВЕ</div>{document.headings.length ? <nav>{document.headings.map((heading) => <a href={`#${heading.id}`} key={heading.id} className={heading.id === activeHeading ? 'toc-active' : ''}><span>{heading.text}</span></a>)}</nav> : <p className="toc-empty">В этой главе нет отдельных разделов.</p>}</aside></div></div>
}

function App() {
  const current = useRoute()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [progress, setProgress] = useState(() => Number(localStorage.getItem('reading-progress') || 0))
  const [lastDocumentId, setLastDocumentId] = useState(() => localStorage.getItem(LAST_DOCUMENT_KEY) || '')
  useEffect(() => { document.body.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => { const onKey = (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true) } if (event.key === 'Escape') setSearchOpen(false) }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [])
  useEffect(() => { if (!current) return; localStorage.setItem(LAST_DOCUMENT_KEY, current.id); setLastDocumentId(current.id) }, [current])
  useEffect(() => { if (!current) return; const onScroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; const value = Math.round((window.scrollY / Math.max(max, 1)) * 100); if (value > progress) { setProgress(value); localStorage.setItem('reading-progress', String(value)) } }; window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll) }, [current, progress])
  const resumeDocument = findDocument(lastDocumentId)
  return <><Header progress={progress} onSearch={() => setSearchOpen(true)} dark={dark} setDark={setDark} /><div className={`app-shell ${menuOpen ? 'menu-open' : ''}`}>{current ? <Reader document={current} onMenu={() => setMenuOpen(!menuOpen)} /> : <Home progress={progress} hasResume={Boolean(resumeDocument)} onStart={() => navigate((resumeDocument || firstDocument).id)} />}</div>{searchOpen && <SearchModal close={() => setSearchOpen(false)} />}</>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
