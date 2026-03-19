import React from 'react';
import htm from 'htm';
import IthrasLogo from '/shared/components/IthrasLogo.js';

const html = htm.bind(React.createElement);

const ClockIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
`;

const CheckIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
`;

const STEPS = [
  'Account created',
  'Profile submitted for review',
  'Admin approval pending',
];

const PendingApprovalPage = ({ onBack }) => {
  const handleBack = (e) => {
    e.preventDefault();
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  return html`
    <div
      style=${{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f3ff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style=${{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
          padding: '48px 40px',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style=${{ marginBottom: '20px' }}>
          <${IthrasLogo} size="md" theme="dark" />
        </div>

        <div
          style=${{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: '#4F46E5',
          }}
        >
          <${ClockIcon} />
        </div>

        <h1
          style=${{
            fontSize: '22px',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}
        >
          Your application is under review
        </h1>
        <p
          style=${{
            fontSize: '15px',
            color: '#6B7280',
            lineHeight: '1.6',
            margin: '0 0 32px',
          }}
        >
          Thanks for signing up for Ithras. An admin will review your account shortly.
          You'll be able to sign in as soon as you're approved.
        </p>

        <div
          style=${{
            background: '#F9FAFB',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '32px',
            textAlign: 'left',
          }}
        >
          ${STEPS.map((step, i) => {
            const done = i < 2;
            const active = i === 2;
            return html`
              <div
                key=${step}
                style=${{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '6px 0',
                  borderBottom: i < STEPS.length - 1 ? '1px solid #F3F4F6' : 'none',
                  marginBottom: i < STEPS.length - 1 ? '6px' : '0',
                }}
              >
                <div
                  style=${{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: done ? '#10B981' : active ? '#EEF2FF' : '#F3F4F6',
                    color: done ? '#fff' : active ? '#4F46E5' : '#9CA3AF',
                    border: active ? '2px solid #C7D2FE' : 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  ${done ? html`<${CheckIcon} />` : html`<span>${i + 1}</span>`}
                </div>
                <span
                  style=${{
                    fontSize: '13px',
                    fontWeight: active ? 600 : done ? 500 : 400,
                    color: done ? '#374151' : active ? '#4F46E5' : '#9CA3AF',
                  }}
                >
                  ${step}
                </span>
                ${active ? html`
                  <span
                    style=${{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#F59E0B',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: '999px',
                      padding: '2px 8px',
                    }}
                  >
                    Pending
                  </span>
                ` : null}
              </div>
            `;
          })}
        </div>

        <a
          href="/"
          onClick=${handleBack}
          style=${{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#6B7280',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            background: '#fff',
            transition: 'background 150ms',
          }}
          onMouseEnter=${(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
          onMouseLeave=${(e) => { e.currentTarget.style.background = '#fff'; }}
        >
          ← Back to sign in
        </a>
      </div>
    </div>
  `;
};

export default PendingApprovalPage;
