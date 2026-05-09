import { Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { PageSEO } from '../../components/common/PageSEO';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../services/userService';
import { isProfileComplete, resolvePostAuthPath } from '../../utils/authFlow';
import { roles } from '../../utils/constants';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const initialFormState = {
  fullName: '',
  phoneNumber: '',
  email: '',
  password: '',
  role: ''
};

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryMode = searchParams.get('mode');
  const queryRole = searchParams.get('role');
  const initialRole = roles.some((item) => item.value === queryRole) ? queryRole : '';
  const {
    currentUser,
    userProfile,
    loading,
    isFirebaseConfigured,
    registerWithEmail,
    loginWithApple,
    loginWithEmail,
    loginWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
    createBaseUserProfile
  } = useAuth();

  const [mode, setMode] = useState(queryMode === 'login' ? 'login' : 'signup');
  const [role, setRole] = useState(initialRole);
  const [formValues, setFormValues] = useState({
    ...initialFormState,
    role: initialRole
  });
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && currentUser && !submitting) {
      navigate(resolvePostAuthPath({ profile: userProfile, fallbackRole: role }), {
        replace: true
      });
    }
  }, [currentUser, loading, navigate, role, submitting, userProfile]);

  useEffect(() => {
    if (queryMode === 'login' || queryMode === 'signup') {
      setMode(queryMode);
    }

    if (roles.some((item) => item.value === queryRole)) {
      setRole(queryRole);
      setFormValues((prev) => ({ ...prev, role: queryRole }));
    }
  }, [queryMode, queryRole]);

  const redirectAfterAuth = async (profile, fallbackRole = role) => {
    const from = location.state?.from;

    if (
      isProfileComplete(profile) &&
      from?.pathname &&
      !['/auth', '/complete-profile'].includes(from.pathname)
    ) {
      navigate(`${from.pathname}${from.search ?? ''}`, { replace: true });
      return;
    }

    navigate(resolvePostAuthPath({ profile, fallbackRole }), { replace: true });
  };

  const persistBaseProfile = async (user, fallbackRole = role) => {
    const profile = await createBaseUserProfile(user, {
      fullName: formValues.fullName || user.displayName || '',
      phoneNumber: formValues.phoneNumber || user.phoneNumber || '',
      email: formValues.email || user.email || '',
      role: fallbackRole
    });

    return profile;
  };

  const ensureProfileRecord = async (user, { forceBaseWrite = false, fallbackRole = role } = {}) => {
    let profile = await getUserProfile(user.uid);

    if (!profile || (forceBaseWrite && !isProfileComplete(profile))) {
      profile = await persistBaseProfile(user, fallbackRole);
    }

    return profile;
  };

  const handleChange = (key, value) =>
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'role' ? { role: value } : {})
    }));

  const canSubmitEmail =
    mode === 'signup'
      ? Boolean(
          role &&
            formValues.fullName.trim() &&
            formValues.email.trim() &&
            formValues.password.trim()
        )
      : Boolean(role && formValues.email.trim() && formValues.password.trim());

  const selectedRole = roles.find((item) => item.value === role);
  const roleDescriptions = {
    client: 'Request services, set a budget, book workers, and manage hiring history.',
    labour: 'Receive customer requests, accept jobs, track earnings, and manage availability.'
  };

  const updateAuthUrl = (nextRole = role, nextMode = mode) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextRole) {
      nextParams.set('role', nextRole);
    } else {
      nextParams.delete('role');
    }

    nextParams.set('mode', nextMode);
    navigate(`/auth?${nextParams.toString()}`, { replace: true, state: location.state });
  };

  const handleRoleSelect = (nextRole) => {
    setRole(nextRole);
    handleChange('role', nextRole);
    updateAuthUrl(nextRole, mode);
  };

  const handleModeSelect = (nextMode) => {
    setMode(nextMode);
    updateAuthUrl(role, nextMode);
  };

  const requireRoleSelection = () => {
    if (role) {
      return true;
    }

    toast.error('Choose Client or Labour before continuing.');
    return false;
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();

    if (!requireRoleSelection()) {
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const user = await registerWithEmail({
          email: formValues.email,
          password: formValues.password,
          fullName: formValues.fullName
        });

        const profile = await ensureProfileRecord(user, {
          forceBaseWrite: true,
          fallbackRole: role
        });

        toast.success('Account created. Complete your profile on the next screen.');
        await redirectAfterAuth(profile, role);
      } else {
        const user = await loginWithEmail({
          email: formValues.email,
          password: formValues.password
        });
        const profile = await ensureProfileRecord(user, { fallbackRole: role });

        toast.success(
          isProfileComplete(profile)
            ? 'Welcome back to WorkLink.'
            : 'Login successful. Complete your profile to continue.'
        );
        await redirectAfterAuth(profile, role);
      }
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!requireRoleSelection()) {
      return;
    }

    setSubmitting(true);

    try {
      const user = await loginWithGoogle();
      const profile = await ensureProfileRecord(user, {
        forceBaseWrite: mode === 'signup',
        fallbackRole: role
      });

      toast.success(
        mode === 'signup'
          ? 'Google sign up complete. Finish your profile on the next screen.'
          : isProfileComplete(profile)
            ? 'Google login complete.'
            : 'Google login complete. Finish your profile to continue.'
      );
      await redirectAfterAuth(profile, role);
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppleAuth = async () => {
    if (!requireRoleSelection()) {
      return;
    }

    setSubmitting(true);

    try {
      const user = await loginWithApple();
      const profile = await ensureProfileRecord(user, {
        forceBaseWrite: mode === 'signup',
        fallbackRole: role
      });

      toast.success(
        mode === 'signup'
          ? 'Apple sign up complete. Finish your profile on the next screen.'
          : isProfileComplete(profile)
            ? 'Apple login complete.'
            : 'Apple login complete. Finish your profile to continue.'
      );
      await redirectAfterAuth(profile, role);
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!requireRoleSelection()) {
      return;
    }

    if (!formValues.phoneNumber.trim()) {
      toast.error('Enter your phone number before requesting an OTP.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await sendPhoneOtp(formValues.phoneNumber);
      setConfirmationResult(result);
      toast.success('OTP sent to your phone number.');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) {
      return;
    }

    if (!requireRoleSelection()) {
      return;
    }

    setSubmitting(true);
    try {
      const user = await verifyPhoneOtp(confirmationResult, otp);
      const profile = await ensureProfileRecord(user, {
        forceBaseWrite: mode === 'signup',
        fallbackRole: role
      });

      toast.success(
        mode === 'signup'
          ? 'Phone verification complete. Finish your profile on the next screen.'
          : isProfileComplete(profile)
            ? 'Phone verification complete.'
            : 'Phone verification complete. Finish your profile to continue.'
      );
      await redirectAfterAuth(profile, role);
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageSEO
        title="Login / Signup"
        description="Join WorkLink as labour or client using phone OTP, Google login, Apple login, or email and password."
      />

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-card overflow-hidden rounded-[36px] p-8 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              <Sparkles size={16} />
              Fast access first
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold text-slate-950 md:text-5xl">
              Sign in first. Complete work details on the next screen.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              WorkLink now keeps labour and client profile details out of the login screen. Users authenticate first, then finish the information needed for hiring, booking, and trust.
            </p>
            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Step 1: choose role and login</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Pick labour or client, then continue with email, Google, Apple, or phone OTP.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Step 2: complete profile</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      After access is granted, WorkLink opens a dedicated page for skills, location, wage, and client details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="rounded-[36px] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold text-slate-950">
                  {role ? `${selectedRole?.label} access` : 'Choose your WorkLink role'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {role
                    ? `Continue as ${selectedRole?.label}. After login, you will only see ${selectedRole?.label.toLowerCase()} features.`
                    : 'Select Client or Labour first. Then we will show login and signup options for that role.'}
                </p>
              </div>
              {role ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mode === 'login' ? 'primary' : 'outline'}
                    onClick={() => handleModeSelect('login')}
                  >
                    Login
                  </Button>
                  <Button
                    type="button"
                    variant={mode === 'signup' ? 'primary' : 'outline'}
                    onClick={() => handleModeSelect('signup')}
                  >
                    Signup
                  </Button>
                </div>
              ) : null}
            </div>

            {!isFirebaseConfigured ? (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Firebase environment variables are not configured yet. The UI is ready, and live authentication will start working after you add your Firebase keys to `.env`.
              </div>
            ) : null}

            {!role ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {roles.map((item) => (
                  <div
                    key={item.value}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-lg font-semibold text-slate-950">
                      Continue as {item.label}
                    </p>
                    <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">
                      {roleDescriptions[item.value]}
                    </p>
                    <Button
                      type="button"
                      className="mt-5 w-full"
                      onClick={() => handleRoleSelect(item.value)}
                    >
                      Select {item.label}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-900">Selected role</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roles.map((item) => (
                      <Button
                        key={item.value}
                        type="button"
                        variant={role === item.value ? 'primary' : 'outline'}
                        onClick={() => handleRoleSelect(item.value)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {roleDescriptions[role]}
                  </p>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleEmailAuth}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {mode === 'signup' ? (
                      <InputField
                        label="Full name"
                        value={formValues.fullName}
                        onChange={(event) => handleChange('fullName', event.target.value)}
                        placeholder="Your full name"
                      />
                    ) : null}
                    <InputField
                      label="Phone number"
                      value={formValues.phoneNumber}
                      onChange={(event) => handleChange('phoneNumber', event.target.value)}
                      placeholder="+91 98765 43210"
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={formValues.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                      placeholder="name@example.com"
                    />
                    <InputField
                      label="Password"
                      type="password"
                      value={formValues.password}
                      onChange={(event) => handleChange('password', event.target.value)}
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={submitting || !canSubmitEmail}>
                    {submitting ? 'Please wait...' : mode === 'signup' ? 'Continue with Email' : 'Login with Email'}
                  </Button>
                </form>

                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleGoogleAuth}
                    disabled={submitting}
                  >
                    Continue with Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleAppleAuth}
                    disabled={submitting}
                  >
                    Continue with Apple
                  </Button>

                  <div className="rounded-3xl border border-slate-200 p-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <InputField
                        label="Phone OTP login"
                        value={formValues.phoneNumber}
                        onChange={(event) => handleChange('phoneNumber', event.target.value)}
                        placeholder="+91 98765 43210"
                      />
                      <div className="self-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full md:w-auto"
                          onClick={handleSendOtp}
                          disabled={submitting || !formValues.phoneNumber.trim()}
                        >
                          Send OTP
                        </Button>
                      </div>
                    </div>

                    {confirmationResult ? (
                      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                        <InputField
                          label="Enter OTP"
                          value={otp}
                          onChange={(event) => setOtp(event.target.value)}
                          placeholder="6 digit code"
                        />
                        <div className="self-end">
                          <Button
                            type="button"
                            className="w-full md:w-auto"
                            onClick={handleVerifyOtp}
                            disabled={submitting || !otp.trim()}
                          >
                            Verify OTP
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    <div id="recaptcha-container" />
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </section>
    </AppShell>
  );
};

export default AuthPage;
