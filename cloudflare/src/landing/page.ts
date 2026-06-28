import { LOGO_MARK } from "./brand";

const SHOWCASE_VIDEO =
  "https://customer-66r76dr3ajvj8gjw.cloudflarestream.com/c151f61aa4d5d840392b39ea46d0ef6a/iframe?muted=true&preload=true&loop=true&autoplay=true&poster=https%3A%2F%2Fcustomer-66r76dr3ajvj8gjw.cloudflarestream.com%2Fc151f61aa4d5d840392b39ea46d0ef6a%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600&controls=false";

const HERO_VIDEO =
  "https://customer-66r76dr3ajvj8gjw.cloudflarestream.com/c7774c73917f59533837cf94bbb0fa73/iframe?muted=true&preload=true&loop=true&autoplay=true&poster=https%3A%2F%2Fcustomer-66r76dr3ajvj8gjw.cloudflarestream.com%2Fc7774c73917f59533837cf94bbb0fa73%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600&controls=false";

export function downloadPageHtml(version: string, downloadUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Signal Canvas is the essential macOS investigation console. Map Telegram signals, run Hermes AI, and export institutional briefs." />
  <meta property="og:title" content="Signal Canvas · macOS Investigation Console" />
  <meta property="og:description" content="Native macOS desk for institutional review. Hermes AI on Cloudflare Workers. Encrypted local vault." />
  <title>Signal Canvas · macOS investigation console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #000000;
      --bg-elevated: #0a0a0a;
      --surface: #111111;
      --surface-hover: #161616;
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.14);
      --text: #ffffff;
      --text-secondary: rgba(255, 255, 255, 0.62);
      --text-muted: rgba(255, 255, 255, 0.42);
      --signal: #ff6b2c;
      --signal-deep: #c44dff;
      --impact: #ff3d00;
      --stripe: #635bff;
      --nvidia: #76b900;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --max: 1120px;
      --nav-h: 64px;
      --font: "Inter", ui-sans-serif, system-ui, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, monospace;
      --ease: cubic-bezier(0.22, 1, 0.36, 1);
    }

    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font: 16px/1.6 var(--font);
      color: var(--text);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    img { max-width: 100%; display: block; }
    a { color: inherit; text-decoration: none; }
    button { font: inherit; cursor: pointer; border: none; background: none; color: inherit; }
    .wrap { width: min(var(--max), calc(100vw - 2rem)); margin: 0 auto; }

    /* Nav — Framer minimal */
    .site-nav {
      position: sticky; top: 0; z-index: 100;
      height: var(--nav-h);
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(16px) saturate(1.2);
      border-bottom: 1px solid var(--border);
    }
    .site-nav-inner {
      height: 100%;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    }
    .brand {
      display: inline-flex; align-items: center; gap: .65rem;
      font-weight: 600; font-size: .92rem; letter-spacing: -.02em;
    }
    .brand-mark {
      width: 28px; height: 28px; border-radius: var(--radius-sm);
      overflow: hidden; border: 1px solid var(--border-strong); flex-shrink: 0;
    }
    .brand-mark svg { width: 100%; height: 100%; display: block; }
    .nav-links {
      display: flex; align-items: center; gap: .15rem;
      position: absolute; left: 50%; transform: translateX(-50%);
    }
    .nav-links a {
      padding: .4rem .75rem; border-radius: var(--radius-sm);
      font-size: .84rem; font-weight: 500; color: var(--text-secondary);
      transition: color .15s ease, background .15s ease;
    }
    .nav-links a:hover { color: var(--text); background: rgba(255,255,255,.05); }
    .nav-actions { display: flex; align-items: center; gap: .5rem; margin-left: auto; }
    .btn-text {
      padding: .5rem .85rem; font-size: .84rem; font-weight: 500;
      color: var(--text-secondary); border-radius: var(--radius-sm);
      transition: color .15s ease;
    }
    .btn-text:hover { color: var(--text); }
    .btn-primary {
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .55rem 1rem; border-radius: var(--radius-sm);
      background: var(--text); color: var(--bg);
      font-size: .84rem; font-weight: 600;
      transition: opacity .15s ease, transform .15s var(--ease);
    }
    .btn-primary:hover { opacity: .92; transform: translateY(-1px); }
    .btn-primary-lg { padding: .85rem 1.25rem; font-size: .92rem; }
    .btn-outline {
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .55rem 1rem; border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: transparent; color: var(--text);
      font-size: .84rem; font-weight: 500;
      transition: background .15s ease, border-color .15s ease;
    }
    .btn-outline:hover { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.22); }
    .btn-accent {
      background: var(--signal); color: var(--bg);
    }
    .btn-accent:hover { opacity: .9; }

    @media (max-width: 860px) {
      .nav-links { display: none; }
    }

    /* Hero */
    .hero {
      position: relative;
      padding: clamp(2rem, 5vw, 3.25rem) 0 clamp(1.75rem, 4vw, 2.5rem);
      overflow: hidden;
    }
    .hero-shader-wrap {
      position: absolute; inset: 0; pointer-events: none;
      opacity: .7;
      mask-image: radial-gradient(ellipse 90% 70% at 50% 20%, black 15%, transparent 78%);
    }
    .hero-aurora {
      position: absolute; inset: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 90% 55% at 15% -5%, rgba(196, 77, 255, 0.22), transparent 58%),
        radial-gradient(ellipse 70% 50% at 88% 8%, rgba(255, 107, 44, 0.16), transparent 55%),
        radial-gradient(ellipse 55% 45% at 50% 105%, rgba(99, 91, 255, 0.12), transparent 52%);
      animation: auroraShift 20s ease-in-out infinite alternate;
    }
    @keyframes auroraShift {
      0% { transform: translate3d(0, 0, 0) scale(1); filter: hue-rotate(0deg); }
      100% { transform: translate3d(-2%, 1%, 0) scale(1.04); filter: hue-rotate(18deg); }
    }
    #hero-shader, #video-shader { width: 100%; height: 100%; }
    .hero-layout {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
      gap: clamp(1.5rem, 4vw, 3rem);
      align-items: center;
    }
    @media (max-width: 920px) {
      .hero-layout {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .hero-media { max-width: 420px; margin: 0 auto; width: 100%; }
    }
    .hero-copy { text-align: left; }
    .hero-kicker {
      display: inline-block;
      margin-bottom: .85rem;
      font-family: var(--font-mono); font-size: .7rem; font-weight: 500;
      letter-spacing: .12em; text-transform: uppercase; color: var(--text-muted);
    }
    .hero-origin {
      margin: 0 0 1.25rem;
      max-width: 46ch;
      font-size: .86rem;
      line-height: 1.55;
      color: var(--text-secondary);
    }
    .hero-origin strong {
      color: var(--text);
      font-weight: 600;
    }
    .hero-sponsors {
      display: flex; flex-wrap: wrap; align-items: center;
      gap: .55rem .85rem;
      margin-bottom: 1.5rem;
    }
    .hero-sponsor {
      display: inline-flex; align-items: center; gap: .45rem;
      padding: .45rem .7rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: rgba(255,255,255,.03);
      transition: border-color .15s ease, background .15s ease, transform .15s var(--ease);
    }
    .hero-sponsor:hover {
      border-color: var(--border-strong);
      background: rgba(255,255,255,.06);
      transform: translateY(-1px);
    }
    .hero-sponsor img { height: auto; width: auto; display: block; object-fit: contain; }
    .hero-sponsor-nvidia img { height: 22px; width: auto; }
    .hero-sponsor-stripe img { height: 22px; width: auto; max-width: 72px; }
    .hero-sponsor-nous {
      gap: .5rem;
      color: var(--text);
      font-size: .82rem;
      font-weight: 600;
      letter-spacing: -.01em;
    }
    .hero-sponsor-nous img {
      height: 20px; width: 20px;
      filter: brightness(0) invert(1);
      opacity: .92;
    }
    .hero-sponsor-x {
      color: var(--text-muted);
      font-size: .82rem;
      font-weight: 500;
      user-select: none;
    }
    .hero h1 {
      margin: 0 0 .85rem;
      font-size: clamp(2rem, 4.2vw, 3.1rem);
      line-height: 1.06;
      letter-spacing: -.045em;
      font-weight: 600;
      max-width: 14ch;
    }
    .hero-lead {
      margin: 0 0 1.35rem;
      font-size: clamp(.92rem, 1.6vw, 1.02rem);
      line-height: 1.6;
      color: var(--text-secondary);
      max-width: 42ch;
    }
    .hero-media { width: 100%; }
    .hero-video {
      position: relative;
      width: 100%;
      padding-top: 100%;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--border-strong);
      box-shadow:
        0 0 0 1px rgba(255,255,255,.04),
        0 0 60px rgba(196, 77, 255, 0.1),
        0 24px 60px rgba(0,0,0,.5);
      background: #000;
    }
    .hero-video iframe {
      border: none;
      position: absolute; top: 0; left: 0;
      height: 100%; width: 100%;
    }
    .hero-actions {
      display: flex; flex-wrap: wrap; gap: .65rem;
      align-items: center;
    }

    /* Stats */
    .stats-band {
      padding: 3rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      background: var(--bg-elevated);
    }
    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem;
    }
    @media (max-width: 800px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    .stat-item {
      padding: 1.25rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }
    .stat-item strong {
      display: block; font-size: .92rem; font-weight: 600;
      letter-spacing: -.02em; margin-bottom: .4rem;
    }
    .stat-item span { color: var(--text-secondary); font-size: .84rem; line-height: 1.5; }

    /* Sections */
    .section-label {
      font-family: var(--font-mono); font-size: .68rem; font-weight: 500;
      letter-spacing: .1em; text-transform: uppercase; color: var(--signal);
      margin-bottom: .75rem;
    }
    .section-title {
      margin: 0 0 .75rem;
      font-size: clamp(1.65rem, 3.5vw, 2.35rem);
      line-height: 1.1; letter-spacing: -.035em; font-weight: 600;
    }
    .section-desc {
      margin: 0; color: var(--text-secondary); font-size: 1rem;
      line-height: 1.6; max-width: 56ch;
    }

    /* Audience tabs — rectangular Framer segments */
    .audience {
      padding: clamp(4rem, 8vw, 6rem) 0;
      border-bottom: 1px solid var(--border);
    }
    .audience-head { margin-bottom: 2rem; max-width: 620px; }
    .tab-bar {
      display: inline-flex; gap: 0;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      overflow: hidden; margin-bottom: 2rem;
      background: var(--surface);
    }
    .tab-btn {
      padding: .6rem 1.1rem;
      font-size: .84rem; font-weight: 500; color: var(--text-secondary);
      border-right: 1px solid var(--border);
      transition: background .15s ease, color .15s ease;
    }
    .tab-btn:last-child { border-right: none; }
    .tab-btn[aria-selected="true"] {
      background: rgba(255,255,255,.08); color: var(--text);
    }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; animation: fadeUp .4s var(--ease); }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .tab-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: .85rem;
    }
    @media (max-width: 900px) { .tab-grid { grid-template-columns: 1fr; } }
    .feature-card {
      padding: 1.35rem;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
      transition: border-color .2s ease, background .2s ease;
    }
    .feature-card:hover { border-color: var(--border-strong); background: var(--surface-hover); }
    .feature-card h3 { margin: 0 0 .45rem; font-size: .98rem; font-weight: 600; letter-spacing: -.02em; }
    .feature-card p { margin: 0; color: var(--text-secondary); font-size: .88rem; line-height: 1.55; }
    .feature-icon {
      font-family: var(--font-mono); font-size: .68rem; font-weight: 500;
      color: var(--signal); letter-spacing: .06em; margin-bottom: .85rem;
    }

    /* Products */
    .products { padding: clamp(4rem, 8vw, 6rem) 0; }
    .products-head {
      display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between;
      gap: 1.5rem; margin-bottom: 2rem;
    }
    .product-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: .85rem;
    }
    @media (max-width: 1024px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .product-grid { grid-template-columns: 1fr; } }
    .product-card {
      padding: 1.25rem;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
      transition: border-color .2s ease, transform .2s var(--ease);
    }
    .product-card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
    .product-card .tag {
      font-family: var(--font-mono); font-size: .64rem; letter-spacing: .08em;
      text-transform: uppercase; color: var(--text-muted); margin-bottom: .65rem; display: block;
    }
    .product-card h3 { margin: 0 0 .35rem; font-size: .95rem; font-weight: 600; }
    .product-card p { margin: 0; color: var(--text-secondary); font-size: .84rem; line-height: 1.5; }

    /* Video showcase section */
    .video-section {
      position: relative;
      padding: clamp(5rem, 10vw, 7.5rem) 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      overflow: hidden;
    }
    .video-shader-wrap {
      position: absolute; inset: 0; pointer-events: none; opacity: .35;
    }
    .video-section-inner {
      position: relative;
      text-align: center;
      max-width: 920px;
      margin: 0 auto;
    }
    .video-section .section-title {
      font-size: clamp(1.75rem, 4vw, 2.75rem);
      letter-spacing: -.04em;
      max-width: 18ch;
      margin-left: auto; margin-right: auto;
    }
    .video-above {
      margin: 1.25rem auto 2.5rem;
      font-size: 1.05rem; line-height: 1.65;
      color: var(--text-secondary); max-width: 52ch;
    }
    .video-frame {
      position: relative;
      padding-top: 56.25%;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--border-strong);
      box-shadow: 0 0 0 1px rgba(255,255,255,.04), 0 48px 120px rgba(0,0,0,.55);
      background: #000;
    }
    .video-frame iframe {
      border: none;
      position: absolute; top: 0; left: 0;
      height: 100%; width: 100%;
    }
    .video-below {
      margin: 2rem auto 0;
      font-size: .92rem; line-height: 1.65;
      color: var(--text-muted); max-width: 48ch;
    }
    .video-meta {
      margin-top: 1.5rem;
      display: flex; flex-wrap: wrap; gap: .5rem;
      justify-content: center;
    }
    .video-meta span {
      padding: .35rem .65rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      font-family: var(--font-mono); font-size: .68rem;
      letter-spacing: .06em; text-transform: uppercase;
      color: var(--text-secondary);
    }

    /* Steps */
    .steps-section {
      padding: clamp(4rem, 8vw, 6rem) 0;
      background: var(--bg-elevated);
    }
    .steps-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: .85rem;
      margin-top: 2rem;
    }
    @media (max-width: 900px) { .steps-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 520px) { .steps-grid { grid-template-columns: 1fr; } }
    .step-card {
      padding: 1.25rem;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
    }
    .step-num {
      font-family: var(--font-mono); font-size: .68rem; font-weight: 500;
      color: var(--signal); letter-spacing: .08em; margin-bottom: .75rem;
    }
    .step-card h3 { margin: 0 0 .4rem; font-size: .95rem; font-weight: 600; }
    .step-card p { margin: 0; color: var(--text-secondary); font-size: .84rem; line-height: 1.5; }

    /* CTA */
    .cta-section { padding: 0 0 4rem; }
    .cta-band {
      position: relative;
      padding: clamp(2.5rem, 5vw, 3.5rem);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      overflow: hidden;
    }
    .cta-inner {
      position: relative;
      display: grid; grid-template-columns: 1fr auto; gap: 2rem; align-items: center;
    }
    @media (max-width: 760px) { .cta-inner { grid-template-columns: 1fr; } }
    .cta-inner h2 {
      margin: 0 0 .55rem;
      font-size: clamp(1.4rem, 2.5vw, 1.85rem);
      letter-spacing: -.03em; font-weight: 600;
    }
    .cta-inner p { margin: 0; color: var(--text-secondary); max-width: 48ch; line-height: 1.6; font-size: .95rem; }
    .cta-specs {
      margin-top: .85rem;
      display: flex; flex-wrap: wrap; gap: .5rem;
    }
    .cta-specs span {
      font-family: var(--font-mono); font-size: .64rem;
      letter-spacing: .06em; text-transform: uppercase;
      color: var(--text-muted);
    }

    /* Footer */
    .site-footer {
      padding: 3rem 0 2.5rem;
      border-top: 1px solid var(--border);
    }
    .footer-grid {
      display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 2rem;
      margin-bottom: 2rem;
    }
    @media (max-width: 800px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
    .footer-brand p {
      margin: .75rem 0 0; color: var(--text-secondary);
      font-size: .84rem; max-width: 28ch; line-height: 1.5;
    }
    .footer-col h4 {
      margin: 0 0 .75rem; font-size: .72rem; font-weight: 600;
      letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted);
    }
    .footer-col a {
      display: block; padding: .2rem 0; font-size: .84rem;
      color: var(--text-secondary); transition: color .15s ease;
    }
    .footer-col a:hover { color: var(--text); }
    .footer-bottom {
      padding-top: 1.5rem; border-top: 1px solid var(--border);
      display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; justify-content: space-between;
      font-size: .78rem; color: var(--text-muted);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation: none !important; transition: none !important; }
    }
  </style>
</head>
<body>
  <header class="site-nav">
    <div class="wrap site-nav-inner">
      <a class="brand" href="#top">
        <span class="brand-mark">${LOGO_MARK}</span>
        Signal Canvas
      </a>
      <nav class="nav-links" aria-label="Primary">
        <a href="#products">Product</a>
        <a href="#for-teams">Solutions</a>
        <a href="#showcase">Showcase</a>
        <a href="#setup">Setup</a>
      </nav>
      <div class="nav-actions">
        <a class="btn-text" href="#showcase">Watch demo</a>
        <a class="btn-primary" href="${downloadUrl}">Download</a>
      </div>
    </div>
  </header>

  <main id="top">
    <section class="hero">
      <div class="hero-aurora" aria-hidden="true"></div>
      <div class="hero-shader-wrap" aria-hidden="true"><div id="hero-shader"></div></div>
      <div class="wrap hero-layout">
        <div class="hero-copy">
          <div class="hero-kicker">macOS · Apple Silicon · v${version}</div>
          <p class="hero-origin">
            Originally built for <strong>The Hermes Agent Accelerated Business Hackathon</strong>
            presented by
          </p>
          <div class="hero-sponsors">
            <a class="hero-sponsor hero-sponsor-nvidia" href="https://x.com/NVIDIAAI" target="_blank" rel="noopener noreferrer" aria-label="NVIDIA AI on X">
              <img src="/brands/nvidia-color.svg" alt="NVIDIA AI" width="88" height="24" />
            </a>
            <span class="hero-sponsor-x" aria-hidden="true">×</span>
            <a class="hero-sponsor hero-sponsor-stripe" href="https://x.com/stripe" target="_blank" rel="noopener noreferrer" aria-label="Stripe on X">
              <img src="/brands/stripe-logo.png" alt="Stripe" width="72" height="30" />
            </a>
            <span class="hero-sponsor-x" aria-hidden="true">×</span>
            <a class="hero-sponsor hero-sponsor-nous" href="https://x.com/NousResearch" target="_blank" rel="noopener noreferrer" aria-label="Nous Research on X">
              <img src="/brands/hermes-agent.svg" alt="" width="20" height="20" aria-hidden="true" />
              <span>Nous Research</span>
            </a>
          </div>
          <h1>The essential macOS investigation console</h1>
          <p class="hero-lead">
            Map Telegram signals on a graph, run Hermes AI on Cloudflare Workers,
            and export institutional briefs. Native, encrypted, and always under your control.
          </p>
          <div class="hero-actions">
            <a class="btn-primary btn-primary-lg" href="${downloadUrl}">Download for macOS</a>
            <a class="btn-outline" href="#showcase">Watch the desk in action</a>
          </div>
        </div>
        <div class="hero-media">
          <div class="hero-video">
            <iframe
              src="${HERO_VIDEO}"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowfullscreen="true"
              title="Signal Canvas hero demo"
            ></iframe>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-band">
      <div class="wrap stats-grid">
        <div class="stat-item"><strong>Native macOS</strong><span>Signed, notarized Apple Silicon app with encrypted local vault. Not a browser tab.</span></div>
        <div class="stat-item"><strong>Always-on Hermes</strong><span>Agent runs on Cloudflare Workers. Scans and chat never depend on a local gateway.</span></div>
        <div class="stat-item"><strong>Graph-first</strong><span>Map accounts, platforms, and keyword clusters on a canvas built for review.</span></div>
        <div class="stat-item"><strong>Institutional</strong><span>Export briefs, audit trails, and case maps for escalation workflows.</span></div>
      </div>
    </section>

    <section class="audience" id="for-teams">
      <div class="wrap">
        <div class="audience-head">
          <div class="section-label">Solutions</div>
          <h2 class="section-title">Built for every stage of review</h2>
          <p class="section-desc">Whether you operate solo, as a team, or across an institution. One desk, isolated cases, shared standards.</p>
        </div>
        <div class="tab-bar" role="tablist" aria-label="Audience">
          <button class="tab-btn" role="tab" aria-selected="true" data-tab="analysts">Analysts</button>
          <button class="tab-btn" role="tab" aria-selected="false" data-tab="teams">Teams</button>
          <button class="tab-btn" role="tab" aria-selected="false" data-tab="institutions">Institutions</button>
        </div>
        <div class="tab-panel active" id="panel-analysts" role="tabpanel">
          <div class="tab-grid">
            <article class="feature-card"><div class="feature-icon">01</div><h3>Ready out of the box</h3><p>Open a case, join Telegram sources, and scan targets without plugin hassle.</p></article>
            <article class="feature-card"><div class="feature-icon">02</div><h3>Complex cases made clear</h3><p>Hermes surfaces correlations and keyword clusters in the context of your graph.</p></article>
            <article class="feature-card"><div class="feature-icon">03</div><h3>Built-in agent desk</h3><p>Scan, watch, correlate, and brief without leaving the canvas.</p></article>
          </div>
        </div>
        <div class="tab-panel" id="panel-teams" role="tabpanel">
          <div class="tab-grid">
            <article class="feature-card"><div class="feature-icon">01</div><h3>Isolated sessions</h3><p>Each investigation is a sealed workspace. Pin, archive, and export without cross-contamination.</p></article>
            <article class="feature-card"><div class="feature-icon">02</div><h3>Shared workflows</h3><p>Standardize scan → correlate → brief pipelines across your team.</p></article>
            <article class="feature-card"><div class="feature-icon">03</div><h3>Audit by design</h3><p>Case creation, scans, and exports leave a review trail on disk.</p></article>
          </div>
        </div>
        <div class="tab-panel" id="panel-institutions" role="tabpanel">
          <div class="tab-grid">
            <article class="feature-card"><div class="feature-icon">01</div><h3>Data stays local</h3><p>Graphs and vault data remain encrypted on the analyst's Mac. BYOK for cloud AI keys.</p></article>
            <article class="feature-card"><div class="feature-icon">02</div><h3>Controlled escalation</h3><p>Export human-reviewed briefs formatted for institutional handoff.</p></article>
            <article class="feature-card"><div class="feature-icon">03</div><h3>Enterprise posture</h3><p>Signed binaries, notarized distribution, and a Hermes gateway you control.</p></article>
          </div>
        </div>
      </div>
    </section>

    <section class="products" id="products">
      <div class="wrap">
        <div class="products-head">
          <div>
            <div class="section-label">Product</div>
            <h2 class="section-title">Everything in one console</h2>
            <p class="section-desc">Graph, monitors, agent, and export in a single native workflow.</p>
          </div>
          <a class="btn-primary" href="${downloadUrl}">Get Signal Canvas</a>
        </div>
        <div class="product-grid">
          <article class="product-card"><span class="tag">Investigation</span><h3>Review Desk</h3><p>Graph workspace for mapping people, accounts, and signal clusters.</p></article>
          <article class="product-card"><span class="tag">Telegram</span><h3>Source Monitor</h3><p>Join chats and attach stream events directly to graph nodes.</p></article>
          <article class="product-card"><span class="tag">Hermes AI</span><h3>Session Agent</h3><p>/scan, /watch, /correlate, and /brief powered by your NVIDIA keys.</p></article>
          <article class="product-card"><span class="tag">Export</span><h3>Institutional Brief</h3><p>Human-reviewed escalation packages from correlated intelligence.</p></article>
        </div>
      </div>
    </section>

    <section class="video-section" id="showcase">
      <div class="video-shader-wrap" aria-hidden="true"><div id="video-shader"></div></div>
      <div class="wrap video-section-inner">
        <div class="section-label">Showcase</div>
        <h2 class="section-title">Trusted by teams who need clarity under pressure</h2>
        <p class="video-above">
          Watch Signal Canvas in motion. Scan targets, map signals on the graph, and work alongside Hermes
          in a single Stratir review desk built for institutional escalation.
        </p>
        <div class="video-frame">
          <iframe
            src="${SHOWCASE_VIDEO}"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowfullscreen="true"
            title="Signal Canvas product demo"
          ></iframe>
        </div>
        <p class="video-below">
          Native macOS · encrypted sessions on disk · Hermes on Cloudflare Workers · bring your own NVIDIA and Telegram keys.
        </p>
        <div class="video-meta">
          <span>Apple Silicon</span>
          <span>Local vault</span>
          <span>Hermes AI</span>
          <span>BYOK</span>
        </div>
      </div>
    </section>

    <section class="steps-section" id="setup">
      <div class="wrap">
        <div class="section-label">Quick start</div>
        <h2 class="section-title">From download to first case</h2>
        <p class="section-desc">Four steps to your first institutional review session.</p>
        <div class="steps-grid">
          <article class="step-card"><div class="step-num">01</div><h3>Download</h3><p>Fetch the Apple Silicon .dmg. Intel Macs are not supported.</p></article>
          <article class="step-card"><div class="step-num">02</div><h3>Install</h3><p>Mount the disk image and move Signal Canvas into Applications.</p></article>
          <article class="step-card"><div class="step-num">03</div><h3>Configure</h3><p>Add NVIDIA and Telegram keys in Settings. Hermes connects automatically.</p></article>
          <article class="step-card"><div class="step-num">04</div><h3>Investigate</h3><p>Open a case, scan sources, and build your graph with Hermes.</p></article>
        </div>
      </div>
    </section>

    <section class="wrap cta-section" id="download">
      <div class="cta-band">
        <div class="cta-inner">
          <div>
            <h2>Start building your review desk</h2>
            <p>Signal Canvas is macOS only. Apple Silicon, macOS 11+, signed and notarized. Download v${version} today.</p>
            <div class="cta-specs">
              <span>Apple Silicon</span>
              <span>Encrypted vault</span>
              <span>Cloudflare Hermes</span>
              <span>BYOK</span>
            </div>
          </div>
          <a class="btn-primary btn-primary-lg btn-accent" href="${downloadUrl}">Download Signal Canvas</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <a class="brand" href="#top"><span class="brand-mark">${LOGO_MARK}</span> Signal Canvas</a>
        <p>Essential tools for institutional investigation and human-reviewed escalation.</p>
      </div>
      <div class="footer-col"><h4>Product</h4><a href="#products">Review Desk</a><a href="#products">Telegram Monitor</a><a href="#products">Hermes Agent</a><a href="${downloadUrl}">Download</a></div>
      <div class="footer-col"><h4>Resources</h4><a href="#setup">Quick start</a><a href="#showcase">Showcase</a><a href="#for-teams">Solutions</a><a href="/api/health">Status</a></div>
      <div class="footer-col"><h4>Platform</h4><a href="#download">macOS requirements</a><a href="#download">Apple Silicon</a><a href="#download">Security</a><span style="display:block;padding:.2rem 0;font-size:.84rem;color:var(--text-muted)">v${version}</span></div>
    </div>
    <div class="wrap footer-bottom">
      <span>© ${new Date().getFullYear()} Signal Canvas</span>
      <span>macOS · Apple Silicon · Institutional investigation console</span>
    </div>
  </footer>

  <script type="module">
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    async function mountHeroShader(el) {
      if (!el || reducedMotion) return;
      try {
        const { ShaderMount, dotOrbitFragmentShader, getShaderColorFromString } =
          await import("https://esm.sh/@paper-design/shaders@0.0.72");
        new ShaderMount(
          el,
          dotOrbitFragmentShader,
          {
            u_colorBack: getShaderColorFromString("#030303"),
            u_colorFront: getShaderColorFromString("#c44dff"),
            u_colorMid: getShaderColorFromString("#ff6b2c"),
            u_spread: 0.42,
            u_size: 2.4,
            u_density: 0.55,
            u_fade: 0.35,
            u_scale: 1.15,
            u_worldWidth: 1200,
            u_worldHeight: 1200,
          },
          {},
          0.12,
          0,
        );
      } catch {
        /* CSS aurora fallback */
      }
    }

    async function mountVideoShader(el) {
      if (!el || reducedMotion) {
        if (el) {
          el.style.background =
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(196,77,255,.1), transparent 60%)";
        }
        return;
      }
      try {
        const { ShaderMount, meshGradientFragmentShader, getShaderColorFromString } =
          await import("https://esm.sh/@paper-design/shaders@0.0.72");
        new ShaderMount(
          el,
          meshGradientFragmentShader,
          {
            u_colors: [
              "#050505",
              "#1a0828",
              "#635bff",
              "#ff3d00",
            ].map(getShaderColorFromString),
            u_colorsCount: 4,
            u_distortion: 0.95,
            u_swirl: 0.72,
            u_grainMixer: 0.1,
            u_grainOverlay: 0.16,
            u_scale: 1.35,
            u_worldWidth: 1600,
            u_worldHeight: 900,
          },
          {},
          0.04,
          0,
        );
      } catch {
        el.style.background =
          "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,91,255,.08), transparent 60%)";
      }
    }

    mountHeroShader(document.getElementById("hero-shader"));
    mountVideoShader(document.getElementById("video-shader"));

    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll(".tab-btn").forEach((b) => b.setAttribute("aria-selected", "false"));
        btn.setAttribute("aria-selected", "true");
        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
        document.getElementById("panel-" + tab)?.classList.add("active");
      });
    });
  </script>
</body>
</html>`;
}
