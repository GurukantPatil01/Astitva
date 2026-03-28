import { useNavigate } from 'react-router-dom';
import './Landing.css';

const FEATURES = [
    { icon: '÷', title: '4 Split Methods', desc: 'Equal, percentage, share-based, or item-level — handle every real-world scenario.' },
    { icon: '🌍', title: 'Multi-Currency', desc: 'Add expenses in any currency. Auto-converted with live forex rates.' },
    { icon: '⚡', title: 'Smart Settlements', desc: 'Minimizes transactions. No more chains of "A pays B pays C".' },
    { icon: '📊', title: 'Visual Analytics', desc: 'Charts showing spending patterns, category breakdowns, and contributions.' },
    { icon: '📋', title: 'Export & Share', desc: 'Download CSV reports or share settlements via WhatsApp.' },
];

const STEPS = [
    { num: '01', title: 'Create a Group', desc: 'Goa Trip, Flat 4B, Office Lunch — name it anything.' },
    { num: '02', title: 'Add Members', desc: 'Add everyone involved. No sign-up needed.' },
    { num: '03', title: 'Log Expenses', desc: 'Who paid, how much, how to split — four methods.' },
    { num: '04', title: 'Settle Up', desc: 'See exactly who pays whom, in minimum transactions.' },
];

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="landing">
            {/* ── Navbar ─────────────────────────────────── */}
            <nav className="landing-nav">
                <div className="landing-nav-brand">
                    <span className="landing-logo">₹</span>
                    Split It Fair
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/app')}>
                    Open App →
                </button>
            </nav>

            {/* ── Hero ──────────────────────────────────── */}
            <section className="hero">
                <div className="hero-badge">✨ Free · No Sign-up Required</div>
                <h1 className="hero-title">
                    Split expenses.<br />
                    <span className="hero-highlight">Without the drama.</span>
                </h1>
                <p className="hero-subtitle">
                    The fairest way to share costs. Handles unequal splits, multiple currencies,
                    and calculates the minimum number of payments to settle up.
                </p>
                <div className="hero-actions">
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/app')}>
                        Start Splitting →
                    </button>
                    <a href="#how-it-works" className="btn btn-secondary btn-lg">
                        How It Works
                    </a>
                </div>
                <div className="hero-stats">
                    <div className="hero-stat">
                        <div className="hero-stat-value">4</div>
                        <div className="hero-stat-label">Split methods</div>
                    </div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat">
                        <div className="hero-stat-value">150+</div>
                        <div className="hero-stat-label">Currencies</div>
                    </div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat">
                        <div className="hero-stat-value">∞</div>
                        <div className="hero-stat-label">Groups</div>
                    </div>
                </div>
            </section>

            {/* ── Features ──────────────────────────────── */}
            <section className="landing-section" id="features">
                <div className="landing-section-header">
                    <span className="section-badge">Features</span>
                    <h2 className="landing-section-title">Everything you need.<br />Nothing you don't.</h2>
                </div>
                <div className="features-grid">
                    {FEATURES.map((f, i) => (
                        <div key={i} className="feature-card">
                            <div className="feature-icon">{f.icon}</div>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── How it Works ──────────────────────────── */}
            <section className="landing-section" id="how-it-works">
                <div className="landing-section-header">
                    <span className="section-badge">How it Works</span>
                    <h2 className="landing-section-title">Four steps. That's it.</h2>
                </div>
                <div className="steps-grid">
                    {STEPS.map((s, i) => (
                        <div key={i} className="step-card">
                            <div className="step-num">{s.num}</div>
                            <h3 className="step-title">{s.title}</h3>
                            <p className="step-desc">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────── */}
            <section className="landing-cta">
                <h2 className="landing-cta-title">Ready to split fairly?</h2>
                <p className="landing-cta-desc">
                    No sign-up. No catch. Just fair expense splitting.
                </p>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/app')}>
                    Get Started Free →
                </button>
            </section>

            <footer className="landing-footer">
                <span style={{ fontWeight: 700 }}>₹ Split It Fair</span>
                <span style={{ color: 'var(--text-3)' }}>·</span>
                <span style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>Built for Astitva Hackathon 2025</span>
            </footer>
        </div>
    );
}
