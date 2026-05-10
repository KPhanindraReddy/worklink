import { ChevronDown, ChevronUp, House } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { PageSEO } from '../../components/common/PageSEO';
import { Skeleton } from '../../components/common/Skeleton';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { isHiddenAdminAccount } from '../../services/authService';
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
const providerNames = {
  'google.com': 'Google',
  'apple.com': 'Apple'
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4A9.6 9.6 0 0 0 2.4 12 9.6 9.6 0 0 0 12 21.6c5.5 0 9.2-3.9 9.2-9.3 0-.6-.1-1.1-.2-1.6H12Z"
    />
    <path
      fill="#34A853"
      d="M2.4 7.6 5.6 10A6 6 0 0 1 12 6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4c-3.7 0-6.9 2.1-8.6 5.2Z"
    />
    <path
      fill="#FBBC05"
      d="M12 21.6c2.6 0 4.8-.9 6.4-2.4l-3-2.4c-.8.6-1.9 1.1-3.4 1.1-3.9 0-5.2-2.6-5.5-3.8L3.2 16.7A9.6 9.6 0 0 0 12 21.6Z"
    />
    <path
      fill="#4285F4"
      d="M21.2 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.3-1.1 2.3-2.1 3.1l3 2.4c1.8-1.7 2.8-4.2 2.8-7.8Z"
    />
  </svg>
);

const getStoredFromLocation = (from) =>
  from?.pathname
    ? {
        pathname: from.pathname,
        search: from.search ?? '',
        hash: from.hash ?? ''
      }
    : null;

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
    consumeRedirectAuthResult,
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
  const [showOtpOptions, setShowOtpOptions] = useState(false);
  const [processingRedirectAuth, setProcessingRedirectAuth] = useState(true);
  const hasProcessedRedirectRef = useRef(false);

  useEffect(() => {
    if (!loading && !processingRedirectAuth && currentUser && !submitting) {
      navigate(resolvePostAuthPath({ profile: userProfile, fallbackRole: role }), {
        replace: true
      });
    }
  }, [currentUser, loading, navigate, processingRedirectAuth, role, submitting, userProfile]);

  useEffect(() => {
    if (queryMode === 'login' || queryMode === 'signup') {
      setMode(queryMode);
    }

    if (roles.some((item) => item.value === queryRole)) {
      setRole(queryRole);
      setFormValues((prev) => ({ ...prev, role: queryRole }));
    }
  }, [queryMode, queryRole]);

  const redirectAfterAuth = async (
    profile,
    fallbackRole = role,
    redirectedFrom = location.state?.from
  ) => {
    const from = redirectedFrom;

    if (
      isProfileComplete(profile) &&
      from?.pathname &&
      !['/auth', '/complete-profile'].includes(from.pathname)
    ) {
      navigate(`${from.pathname}${from.search ?? ''}${from.hash ?? ''}`, { replace: true });
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
    const shouldUpgradeHiddenAdmin =
      isHiddenAdminAccount(
        user,
        {
          email: formValues.email,
          fullName: formValues.fullName
        },
        profile
      ) && profile?.role !== 'admin';

    if (!profile) {
      if (!fallbackRole && !shouldUpgradeHiddenAdmin) {
        return null;
      }

      profile = await persistBaseProfile(user, fallbackRole);
      return profile;
    }

    if (
      shouldUpgradeHiddenAdmin ||
      (fallbackRole && !profile.role) ||
      (forceBaseWrite && fallbackRole && !isProfileComplete(profile))
    ) {
      profile = await persistBaseProfile(user, fallbackRole);
    }

    return profile;
  };

  useEffect(() => {
    let isMounted = true;

    const resumeRedirectAuth = async () => {
      if (hasProcessedRedirectRef.current) {
        return;
      }

      hasProcessedRedirectRef.current = true;

      if (!isFirebaseConfigured) {
        if (isMounted) {
          setProcessingRedirectAuth(false);
        }
        return;
      }

      try {
        const redirectResult = await consumeRedirectAuthResult();

        if (!redirectResult?.user || !isMounted) {
          return;
        }

        setSubmitting(true);

        const fallbackRole = redirectResult.context?.role || role;
        const redirectMode = redirectResult.context?.mode || mode;
        const profile = await ensureProfileRecord(redirectResult.user, {
          forceBaseWrite: redirectMode === 'signup',
          fallbackRole
        });
        const providerName = providerNames[redirectResult.providerId] || 'Social';

        toast.success(
          redirectMode === 'signup'
            ? `${providerName} sign up complete. Finish your profile on the next screen.`
            : isProfileComplete(profile)
              ? `${providerName} login complete.`
              : `${providerName} login complete. Finish your profile to continue.`
        );
        await redirectAfterAuth(profile, fallbackRole, redirectResult.context?.from);
      } catch (error) {
        if (isMounted) {
          toast.error(getFirebaseErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setSubmitting(false);
          setProcessingRedirectAuth(false);
        }
      }
    };

    resumeRedirectAuth();

    return () => {
      isMounted = false;
    };
  }, []);

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
      : Boolean(formValues.email.trim() && formValues.password.trim());

  const selectedRole = roles.find((item) => item.value === role);

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

  const requireRoleSelection = ({
    allowWithoutRole = false,
    message = 'Choose Client or Labour before continuing.'
  } = {}) => {
    if (role || allowWithoutRole) {
      return true;
    }

    toast.error(message);
    return false;
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();

    if (
      !requireRoleSelection({
        allowWithoutRole: mode === 'login'
      })
    ) {
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

        toast.success(
          profile?.role === 'admin'
            ? 'Admin account created. Opening the admin page.'
            : 'Account created. Complete your profile on the next screen.'
        );
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
    if (
      !requireRoleSelection({
        allowWithoutRole: mode === 'login',
        message: 'Choose Client or Labour before continuing with Google.'
      })
    ) {
      return;
    }

    setSubmitting(true);

    try {
      const user = await loginWithGoogle({
        mode,
        role,
        from: getStoredFromLocation(location.state?.from)
      });

      if (!user) {
        return;
      }

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
    if (
      !requireRoleSelection({
        allowWithoutRole: mode === 'login',
        message: 'Choose Client or Labour before continuing with Apple.'
      })
    ) {
      return;
    }

    setSubmitting(true);

    try {
      const user = await loginWithApple({
        mode,
        role,
        from: getStoredFromLocation(location.state?.from)
      });

      if (!user) {
        return;
      }

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
    if (
      !requireRoleSelection({
        message: 'Choose Client or Labour before continuing with phone OTP.'
      })
    ) {
      return;
    }

    if (!formValues.phoneNumber.trim()) {
      toast.error('Enter your phone number before requesting an OTP.');
      return;
    }

    setSubmitting(true);
    try {
      setShowOtpOptions(true);
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

    if (
      !requireRoleSelection({
        message: 'Choose Client or Labour before continuing with phone OTP.'
      })
    ) {
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

  if (loading || processingRedirectAuth || (currentUser && !submitting)) {
    return (
      <AppShell>
        <PageSEO
          title="Login / Signup"
          description="Join WorkLink as labour or client using phone OTP, Google login, Apple login, or email and password."
        />
        <section className="section-space">
          <div className="page-shell max-w-3xl">
            <Card className="rounded-[28px] p-6 md:p-8">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="mt-6 h-12 w-full" />
              <Skeleton className="mt-4 h-12 w-full" />
            </Card>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageSEO
        title="Login / Signup"
        description="Join WorkLink as labour or client using phone OTP, Google login, Apple login, or email and password."
      />

      <section className="section-space">
        <div className="page-shell max-w-3xl">
          <Card className="rounded-[28px] p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-4">
                  <Button as={Link} to="/" type="button" variant="outline" size="sm">
                    <House size={15} />
                    Home
                  </Button>
                </div>
                <h2 className="text-3xl font-bold text-slate-950">
                  {role ? `${selectedRole?.label} ${mode}` : 'Continue to WorkLink'}
                </h2>
              </div>
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
            </div>

            {!isFirebaseConfigured ? (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Firebase environment variables are not configured yet. The UI is ready, and live authentication will start working after you add your Firebase keys to `.env`.
              </div>
            ) : null}

            {!role ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {roles.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={() => handleRoleSelect(item.value)}
                  >
                    Continue with {item.label}
                  </Button>
                ))}
              </div>
            ) : (
              <>
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
                    <GoogleIcon />
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
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => setShowOtpOptions((prev) => !prev)}
                    >
                      <span>Phone OTP login (optional)</span>
                      {showOtpOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>

                    {showOtpOptions || confirmationResult ? (
                      <div className="mt-4">
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
