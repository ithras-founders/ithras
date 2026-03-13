import React, { useState } from 'react';
import htm from 'htm';
import { register } from '../../shared/services/api.js';
import IthrasLogo from '../../shared/components/IthrasLogo.js';
import { Input, Select, Button } from '../../shared/primitives/index.js';

const html = htm.bind(React.createElement);

const StudentSubtype = { UNDERGRADUATE: 'UNDERGRADUATE', GRADUATE: 'GRADUATE', DOCTORAL: 'DOCTORAL', OTHERS: 'OTHERS' };
const STUDENT_SUBTYPE_OPTIONS = [
  { value: StudentSubtype.UNDERGRADUATE, label: 'Undergraduate' },
  { value: StudentSubtype.GRADUATE, label: 'Graduate' },
  { value: StudentSubtype.DOCTORAL, label: 'Doctoral' },
  { value: StudentSubtype.OTHERS, label: 'Others' },
];

const Register = ({ onRegister, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profileType, setProfileType] = useState('CANDIDATE');
  const [studentSubtype, setStudentSubtype] = useState(StudentSubtype.UNDERGRADUATE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password || !name.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = {
        email: email.trim(),
        password,
        name: name.trim(),
        role: profileType,
        student_subtype: profileType === 'CANDIDATE' ? studentSubtype : null,
      };
      const res = await register(data);
      onRegister(res);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div className="min-h-screen flex bg-[var(--app-bg)]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16" style=${{ background: 'linear-gradient(145deg, #0071e3 0%, #0058b0 50%, #003d7a 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.08]" style=${{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="absolute bottom-20 -left-16 w-72 h-72 rounded-full opacity-[0.06]" style=${{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style=${{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>
        <div className="max-w-md relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <${IthrasLogo} size="md" theme="light" />
          </div>
          <h1 className="text-[42px] font-semibold text-white tracking-tight leading-[1.08] mb-5">
            Join Ithras
          </h1>
          <p className="text-white/55 text-[16px] leading-relaxed max-w-sm">
            Build your professional profile, get AI-powered career prep, and connect with opportunities — all on one platform.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16">
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <${IthrasLogo} size="md" theme="dark" />
        </div>

        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-1 tracking-tight">Create account</h2>
          <p className="text-[var(--app-text-secondary)] text-[15px] mb-8">Start your professional journey. No institution required.</p>

          <form onSubmit=${handleSubmit} className="space-y-5">
            ${error ? html`
              <div className="p-3 bg-[var(--app-danger-soft)] rounded-[var(--app-radius-sm)] text-sm text-[var(--app-danger)]">
                ${error}
              </div>
            ` : null}
            <${Input}
              id="name"
              label="Full name"
              type="text"
              value=${name}
              onChange=${(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              disabled=${loading}
            />
            <${Input}
              id="email"
              label="Email"
              type="email"
              value=${email}
              onChange=${(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled=${loading}
            />
            <div>
              <${Input}
                id="password"
                label="Password"
                type="password"
                value=${password}
                onChange=${(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled=${loading}
              />
              <p className="text-[var(--app-text-xs)] text-[var(--app-text-muted)] mt-[var(--app-space-2)]">At least 8 characters</p>
            </div>
            <div>
              <label className="block text-[var(--app-text-sm)] font-medium text-[var(--app-text-primary)] mb-[var(--app-space-2)]">I am a</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="profileType"
                    value="CANDIDATE"
                    checked=${profileType === 'CANDIDATE'}
                    onChange=${() => setProfileType('CANDIDATE')}
                    disabled=${loading}
                  />
                  <span>Student</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="profileType"
                    value="PROFESSIONAL"
                    checked=${profileType === 'PROFESSIONAL'}
                    onChange=${() => setProfileType('PROFESSIONAL')}
                    disabled=${loading}
                  />
                  <span>Professional</span>
                </label>
              </div>
            </div>
            ${profileType === 'CANDIDATE' ? html`
              <${Select}
                id="studentSubtype"
                label="Student type"
                value=${studentSubtype}
                onChange=${(e) => setStudentSubtype(e.target.value)}
                options=${STUDENT_SUBTYPE_OPTIONS}
                disabled=${loading}
              />
            ` : null}
            <${Button}
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              disabled=${loading}
            >
              ${loading ? html`
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ` : 'Create account'}
            <//>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--app-text-secondary)]">
            Already have an account?
            <button type="button" onClick=${onBack} className="ml-1 font-semibold text-[var(--app-accent)] hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  `;
};

export default Register;
