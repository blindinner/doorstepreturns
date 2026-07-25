'use client';

import Link from 'next/link';

const CONFIG = {
  serviceName: "Doorstep Returns",
  forwardEmail: "returns@doorstepreturns.com",
  priceFirst: 12,
  priceExtra: 8,
};

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 22px" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "22px 0",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div
            className="rt-mono"
            style={{
              background: 'var(--tag)',
              color: 'var(--tag-ink)',
              fontWeight: 700,
              fontSize: 12,
              padding: "4px 7px",
              borderRadius: 2,
            }}
          >
            ↩
          </div>
          <div style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
            {CONFIG.serviceName}
          </div>
        </header>

        {/* Hero Section */}
        <div style={{ padding: "56px 0 44px" }}>
          <div
            className="rt-hero"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 40,
              alignItems: "center",
            }}
          >
            <div>
              <h1
                className="rt-serif"
                style={{
                  fontSize: "clamp(38px, 7vw, 62px)",
                  lineHeight: 1.02,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  margin: "0 0 20px",
                }}
              >
                Your returns,
                <br />
                off your hands.
              </h1>
              <p
                className="rt-serif"
                style={{
                  fontSize: 19,
                  lineHeight: 1.55,
                  color: 'var(--ink70)',
                  maxWidth: 460,
                  margin: "0 0 28px",
                }}
              >
                We collect your Amazon returns at your door and drop them at the
                carrier the same evening. No box, no printing, no line.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 26,
                  flexWrap: "wrap",
                  paddingTop: 22,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div>
                  <div className="rt-mono" style={{ fontSize: 26, fontWeight: 700 }}>
                    ${CONFIG.priceFirst}
                  </div>
                  <div className="rt-eyebrow" style={{ color: 'var(--ink40)' }}>
                    First return
                  </div>
                </div>
                <div>
                  <div className="rt-mono" style={{ fontSize: 26, fontWeight: 700 }}>
                    ${CONFIG.priceExtra}
                  </div>
                  <div className="rt-eyebrow" style={{ color: 'var(--ink40)' }}>
                    Each extra, same stop
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                className="rt-tag rt-settle"
                style={{
                  width: 260,
                  padding: "20px 22px 20px 26px",
                  transform: "rotate(-2.2deg)",
                  boxShadow: "0 14px 30px rgba(15,28,38,.13)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 11,
                    right: 11,
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    border: "2px solid rgba(0,0,0,.22)",
                  }}
                />
                <div className="rt-eyebrow" style={{ opacity: 0.65 }}>
                  How it works
                </div>
                <div style={{ fontSize: 15, marginTop: 10, lineHeight: 1.6 }}>
                  <strong>You book.</strong> We come to your door.
                </div>
                <div style={{ fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>
                  <strong>You hand it over.</strong> No box needed.
                </div>
                <div style={{ fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>
                  <strong>We return it.</strong>
                </div>
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: "1px dashed rgba(0,0,0,.28)",
                    fontSize: 13,
                    opacity: 0.7,
                  }}
                >
                  UPS · Whole Foods · Kohl&apos;s · Staples
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div
          style={{
            borderTop: "1px solid var(--line)",
            borderBottom: "1px solid var(--line)",
            padding: "30px 0",
            display: "grid",
            gap: 26,
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          }}
        >
          {[
            ["Forward your email", "Send us your Amazon return email."],
            ["Click the link", "We reply with a booking link."],
            ["We handle the rest", "We pick it up and return it for you."],
          ].map(([h, p], i) => (
            <div key={i}>
              <div className="rt-mono" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>
                0{i + 1}
              </div>
              <div style={{ fontWeight: 600, margin: "7px 0 5px", fontSize: 15.5 }}>{h}</div>
              <div className="rt-serif" style={{ color: 'var(--ink70)', fontSize: 15.5, lineHeight: 1.5 }}>
                {p}
              </div>
            </div>
          ))}
        </div>

        {/* Forward Email CTA */}
        <div style={{ padding: "50px 0 60px", maxWidth: 560 }}>
          <h2
            className="rt-serif"
            style={{ fontSize: 30, fontWeight: 400, margin: "0 0 12px" }}
          >
            Start by forwarding your email
          </h2>
          <p className="rt-serif" style={{ color: 'var(--ink70)', fontSize: 16, margin: "0 0 28px", lineHeight: 1.6 }}>
            Forward your Amazon return confirmation email to us.
            We&apos;ll reply with a link to book your pickup.
          </p>

          <div
            style={{
              background: 'var(--surface)',
              border: "1px solid var(--line)",
              borderLeft: "4px solid var(--accent)",
              borderRadius: 3,
              padding: "24px 28px",
              marginBottom: 24,
            }}
          >
            <div className="rt-eyebrow" style={{ color: 'var(--ink40)', marginBottom: 10 }}>
              Forward to
            </div>
            <div
              className="rt-mono"
              style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}
            >
              {CONFIG.forwardEmail}
            </div>
            <a
              href={`mailto:${CONFIG.forwardEmail}?subject=Amazon%20Return&body=Forward%20your%20Amazon%20return%20email%20here`}
              className="rt-btn"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              Open Email App
            </a>
          </div>

          <p style={{ fontSize: 14, color: 'var(--ink40)', lineHeight: 1.6 }}>
            After you forward the email, check your inbox for our reply with the booking link.
            Make sure to forward from the same email that received the Amazon return confirmation.
          </p>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
            <p style={{ fontSize: 14, color: 'var(--ink40)', margin: 0 }}>
              Already forwarded?{' '}
              <Link href="/book" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                Book your pickup →
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid var(--line)",
            padding: "22px 0 30px",
            fontSize: 12.5,
            color: 'var(--ink40)',
            lineHeight: 1.6,
          }}
        >
          We&apos;re a courier, not an inspector — we can&apos;t verify what&apos;s inside
          sealed packaging, so we photograph everything with you at the door.
        </footer>
      </div>
    </div>
  );
}
