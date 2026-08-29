import React, { useState, useEffect } from 'react';
import { usePos } from '../context/PosContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Store,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  ChevronLeft,
} from 'lucide-react';
import { sounds } from '../utils/audio';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset-password';

export const AuthView: React.FC = () => {
  const {
    signIn,
    signUp,
    resetPasswordForEmail,
    updateUserPassword,
    resendVerificationEmail,
    authError,
    isSupabaseActive,
  } = usePos();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  // Check if current URL is a password recovery link
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      setMode('reset-password');
    }
  }, []);

  const clearMessages = () => {
    setLocalError(null);
    setSuccessMessage(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(cleanEmail, password);
      if (!result.success && result.error) {
        setLocalError(result.error);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanName = fullName.trim();
    const cleanRestName = restaurantName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!cleanRestName) {
      setLocalError('Please enter your restaurant name.');
      return;
    }
    if (!cleanEmail) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please create a password.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify and re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await signUp(cleanName, cleanEmail, password, cleanRestName);
      if (res.success) {
        if (res.requireEmailVerification) {
          setIsVerificationSent(true);
          setSuccessMessage(`Account created! A verification email has been sent to ${cleanEmail}. Please verify your email before signing in.`);
        }
      } else if (res.error) {
        setLocalError(res.error);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setLocalError('Please enter the email address associated with your account.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordForEmail(cleanEmail);
      if (res.success) {
        setSuccessMessage(`Password reset link sent to ${cleanEmail}. Please check your inbox.`);
      } else if (res.error) {
        setLocalError(res.error);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserPassword(password);
      if (res.success) {
        setSuccessMessage('Your password has been updated successfully. You can now sign in with your new credentials.');
        setPassword('');
        setConfirmPassword('');
        setMode('signin');
      } else if (res.error) {
        setLocalError(res.error);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setLoading(true);
    clearMessages();
    try {
      const res = await resendVerificationEmail(email.trim());
      if (res.success) {
        setSuccessMessage(`Verification email resent to ${email.trim()}.`);
      } else if (res.error) {
        setLocalError(res.error);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to resend email.');
    } finally {
      setLoading(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] flex flex-col justify-center items-center p-4 relative font-sans text-[#1a1a1a]">
      {/* Background Subtle Utility Grid */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#e5e7eb] flex items-center justify-center shadow-sm overflow-hidden">
              <img
                src="/prawar-logo.jpeg"
                alt="Prawar"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black tracking-tight text-[#1a1a1a] uppercase leading-none">
                PrawarPOS
              </h1>
              <p className="text-[11px] font-semibold text-[#6b7280] tracking-wide mt-1">
                Restaurant Management & Thermal Billing
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e7eb] shadow-sm">
          
          {/* Card Title & Description */}
          <div className="mb-5">
            {mode === 'signin' && (
              <>
                <h2 className="text-xl font-extrabold text-[#1a1a1a] uppercase tracking-tight">
                  Staff Sign In
                </h2>
                <p className="text-xs text-[#6b7280] mt-1 font-medium">
                  Enter your email and password to access your restaurant station.
                </p>
              </>
            )}

            {mode === 'signup' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('signin');
                    }}
                    className="p-1 -ml-1 text-gray-500 hover:text-black rounded-lg transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xl font-extrabold text-[#1a1a1a] uppercase tracking-tight">
                    Register Restaurant
                  </h2>
                </div>
                <p className="text-xs text-[#6b7280] font-medium">
                  Create an owner account and establish your restaurant branch.
                </p>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('signin');
                    }}
                    className="p-1 -ml-1 text-gray-500 hover:text-black rounded-lg transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xl font-extrabold text-[#1a1a1a] uppercase tracking-tight">
                    Reset Password
                  </h2>
                </div>
                <p className="text-xs text-[#6b7280] font-medium">
                  Enter your registered email and we will send a password reset link.
                </p>
              </>
            )}

            {mode === 'reset-password' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound className="w-5 h-5 text-[#FF6321]" />
                  <h2 className="text-xl font-extrabold text-[#1a1a1a] uppercase tracking-tight">
                    Set New Password
                  </h2>
                </div>
                <p className="text-xs text-[#6b7280] font-medium">
                  Please enter your new secure password below.
                </p>
              </>
            )}
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 rounded-2xl bg-green-50 border border-green-200 p-3.5 text-xs font-semibold text-green-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p>{successMessage}</p>
                {isVerificationSent && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="mt-2 text-[11px] font-bold text-green-700 underline hover:text-green-900 cursor-pointer"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {displayedError && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="flex-1 leading-relaxed">{displayedError}</p>
            </div>
          )}

          {/* Environment Warning when Supabase keys are default/missing */}
          {!isSupabaseActive && (
            <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-[11px] font-medium text-amber-900 flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
              <p>
                <strong>Notice:</strong> Configure <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> in your environment settings for production Supabase cloud auth.
              </p>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    id="login-email-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('forgot');
                    }}
                    className="text-[11px] font-bold text-[#FF6321] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    id="login-password-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-10 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="submit-signin-btn"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1a1a1a] hover:bg-black active:scale-99 text-white font-extrabold uppercase tracking-wider py-3 text-xs transition cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-[#e5e7eb] text-center">
                <p className="text-xs text-[#6b7280]">
                  New restaurant setup?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('signup');
                    }}
                    className="font-bold text-[#FF6321] hover:underline cursor-pointer"
                  >
                    Register Restaurant & Owner
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* MODE 2: SIGN UP / REGISTER RESTAURANT */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-1">
                  Restaurant Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={e => setRestaurantName(e.target.value)}
                    placeholder="e.g. Urban Spice Bistro"
                    className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. owner@urbanspice.com"
                    className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-8 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-8 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                id="submit-signup-btn"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FF6321] hover:bg-[#e05418] text-white font-extrabold uppercase tracking-wider py-3 text-xs transition cursor-pointer disabled:opacity-60 mt-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Restaurant Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="text-xs font-bold text-[#6b7280] hover:text-[#1a1a1a] cursor-pointer"
                >
                  Already have an account? <span className="text-[#FF6321]">Sign in</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                  Your Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1a1a1a] hover:bg-black text-white font-extrabold uppercase tracking-wider py-3 text-xs transition cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="text-xs font-bold text-[#6b7280] hover:text-[#1a1a1a] cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: RESET PASSWORD (RECOVERY) */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-10 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pl-10 pr-10 py-2.5 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:border-[#FF6321] focus:outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FF6321] hover:bg-[#e05418] text-white font-extrabold uppercase tracking-wider py-3 text-xs transition cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password & Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Security Footer */}
        <div className="mt-5 flex items-center justify-between text-[11px] text-[#6b7280] px-2">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Supabase Auth & RLS Protected</span>
          </div>
          <span className="font-semibold text-gray-400">PrawarPOS v6.0</span>
        </div>

      </div>
    </div>
  );
};
