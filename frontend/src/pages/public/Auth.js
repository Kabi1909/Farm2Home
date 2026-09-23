import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Sprout, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth, useUI } from '../../context/AppContext';
import * as auth from '../../services/authService';
import { validPhone } from '../../utils/helpers';
import { passwordError, authErrorMessage } from '../../utils/registration.js';
import { Field } from '../../components/common/UI';
import { images } from '../../data/catalog';
export default function Auth({ mode = 'login' }) {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: params.get('email') || '',
    phone: '',
    password: '',
    confirm: '',
    role: params.get('role') === 'farmer' ? 'farmer' : 'customer',
  });
  const [show, setShow] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const { signIn } = useAuth();
  const { notify } = useUI();
  const navigate = useNavigate(),
    location = useLocation();
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const registering = mode === 'register',
    forgot = mode === 'forgot-password',
    reset = mode === 'reset-password';
  async function submit(e) {
    e.preventDefault();
    setError('');
    if (registering && !form.name.trim()) return setError('Enter your full name.');
    if (registering && !validPhone(form.phone))
      return setError('Enter a valid Sri Lankan phone number, such as 0771234567.');
    if ((registering || reset) && form.password !== form.confirm)
      return setError('Passwords do not match.');
    if ((registering || reset) && passwordError(form.password))
      return setError(passwordError(form.password));
    setLoading(true);
    try {
      const account = registering
        ? await auth.register(form)
        : await auth.login(form.email, form.password);
      if (registering) {
        notify('Account created. Please sign in.');
        navigate('/login');
      } else {
        await signIn(account);
        notify('Welcome back, ' + account.name.split(' ')[0] + '.');
        const from = location.state?.from;
        navigate(from?.startsWith('/' + account.role) ? from : `/${account.role}/dashboard`);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth-page">
      <div
        className="auth-visual"
        style={{
          backgroundImage: `linear-gradient(0deg,rgba(23,55,31,.8),rgba(23,55,31,.08)),url(${images.farm})`,
        }}
      >
        <Sprout size={45} />
        <div>
          <span className="eyebrow">GROWN WITH CARE. SHARED WITH LOVE.</span>
          <h1>
            Good food begins
            <br />
            with good people.
          </h1>
          <p>Join a community bringing Sri Lanka’s farms and families a little closer.</p>
        </div>
        <span>Rooted in Sri Lanka. Growing together.</span>
      </div>
      <div className="auth-form">
        <Link to="/" className="logo">
          <Sprout />
          Farm2Home<span>LK</span>
        </Link>
        <h1>
          {registering
            ? 'Grow with us.'
            : forgot
              ? 'Forgot your password?'
              : reset
                ? 'A fresh start.'
                : 'Welcome back.'}
        </h1>
        <p>
          {registering
            ? 'Your journey to fresher food starts here.'
            : forgot
              ? 'Account recovery'
              : reset
                ? 'Account recovery'
                : 'Fresh finds and familiar farms are waiting.'}
        </p>
        {forgot || reset ? (
          <div className="notice" role="status">
            <p>Password recovery is not available yet. No reset request has been sent.</p>
            <Link to="/login">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            {registering && (
              <>
                <div className="role-picker">
                  {['customer', 'farmer'].map((role) => (
                    <button
                      type="button"
                      key={role}
                      className={form.role === role ? 'selected' : ''}
                      onClick={() => set('role', role)}
                    >
                      {role === 'customer' ? 'I’m a customer' : 'I’m a farmer'}
                    </button>
                  ))}
                </div>
                <Field
                  label="Full name"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </>
            )}
            <Field
              label="Email address"
              type="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              autoComplete="email"
            />
            {registering && (
              <Field
                label="Phone number"
                type="tel"
                required
                placeholder="0771234567"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            )}{' '}
            {!forgot && (
              <Field label="Password">
                <div className="password-input">
                  <input
                    required
                    minLength={registering || reset ? 10 : 1}
                    maxLength={72}
                    type={show ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    autoComplete={registering || reset ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    aria-label={show ? 'Hide password' : 'Show password'}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
            )}
            {(registering || reset) && (
              <>
                <div className="strength">
                  <span style={{ width: `${Math.min(100, form.password.length * 8)}%` }} />
                </div>
                <small>
                  {form.password
                    ? passwordError(form.password) || 'Password meets all requirements.'
                    : 'Use 10–72 characters, including uppercase, lowercase, a number and a symbol.'}
                </small>
                <Field
                  label="Confirm password"
                  type={show ? 'text' : 'password'}
                  required
                  minLength={10}
                  value={form.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                />
              </>
            )}
            {mode === 'login' && (
              <div className="between">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <button className="btn full" disabled={loading}>
              {loading
                ? 'Please wait…'
                : registering
                  ? 'Create account'
                  : forgot
                    ? 'Create reset link'
                    : reset
                      ? 'Update password'
                      : 'Sign in'}
              <ArrowRight size={17} />
            </button>
          </form>
        )}
        <p className="auth-switch">
          {registering ? 'Already part of the community?' : 'New to Farm2Home?'}{' '}
          <Link to={registering ? '/login' : '/register'}>
            {registering ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </main>
  );
}
