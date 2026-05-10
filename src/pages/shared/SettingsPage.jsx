import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ShieldCheck, UserRound } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { PageSEO } from '../../components/common/PageSEO';
import { SelectField } from '../../components/common/SelectField';
import { TextAreaField } from '../../components/common/TextAreaField';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { updateUserSettings } from '../../services/userService';
import { availabilityOptions, languageOptions, workCategories } from '../../utils/constants';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const buildProfileForm = (profile, currentUser) => ({
  fullName: profile?.fullName || currentUser?.displayName || '',
  phoneNumber: profile?.phoneNumber || currentUser?.phoneNumber || '',
  email: profile?.email || currentUser?.email || '',
  location: profile?.location || '',
  currentLocation: profile?.currentLocation || profile?.location || '',
  category: profile?.category || '',
  skills: Array.isArray(profile?.skills) ? profile.skills.join(', ') : '',
  languages: Array.isArray(profile?.languages) ? profile.languages.join(', ') : '',
  gender: profile?.gender || '',
  age: profile?.age ?? '',
  education: profile?.education || '',
  experienceYears: profile?.experienceYears ?? '',
  dailyWage: profile?.dailyWage ?? '',
  availability: profile?.availability || 'Available',
  about: profile?.about || ''
});

const SettingsPage = () => {
  const { currentUser, userProfile, createOrUpdateUserProfile, logout } = useAuth();
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    whatsappAlerts: false
  });
  const [formValues, setFormValues] = useState(() => buildProfileForm(userProfile, currentUser));
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    setFormValues(buildProfileForm(userProfile, currentUser));
    setPreferences({
      emailAlerts: userProfile?.settings?.emailAlerts ?? true,
      whatsappAlerts: userProfile?.settings?.whatsappAlerts ?? false
    });
  }, [currentUser, userProfile]);

  const roleSummary = useMemo(
    () => (userProfile?.role ? `${userProfile.role} account` : 'No role assigned'),
    [userProfile?.role]
  );
  const profileInitial = useMemo(
    () => (userProfile?.fullName || currentUser?.displayName || 'U').trim().charAt(0).toUpperCase(),
    [currentUser?.displayName, userProfile?.fullName]
  );
  const isLabour = userProfile?.role === 'labour';
  const isClient = userProfile?.role === 'client';
  const canSaveProfile = isLabour
    ? Boolean(
        formValues.fullName.trim() &&
          (formValues.phoneNumber.trim() || formValues.email.trim()) &&
          formValues.currentLocation.trim() &&
          formValues.category &&
          formValues.skills.trim()
      )
    : isClient
      ? Boolean(
          formValues.fullName.trim() &&
            (formValues.phoneNumber.trim() || formValues.email.trim()) &&
            formValues.location.trim()
        )
      : Boolean(
          formValues.fullName.trim() &&
            (formValues.phoneNumber.trim() || formValues.email.trim())
        );

  const updateFormValue = (key, value) =>
    setFormValues((prev) => ({
      ...prev,
      [key]: value
    }));

  const saveProfile = async () => {
    if (!currentUser || !userProfile?.role) {
      return;
    }

    setSavingProfile(true);

    try {
      await createOrUpdateUserProfile(currentUser, {
        ...formValues,
        role: userProfile.role,
        location: isClient ? formValues.location : formValues.currentLocation,
        currentLocation: isLabour ? formValues.currentLocation : '',
        about: isLabour ? formValues.about : ''
      });
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    if (!currentUser) {
      return;
    }

    setSavingPreferences(true);

    try {
      await updateUserSettings(currentUser.uid, preferences);
      toast.success('Preferences saved.');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <AppShell>
      <PageSEO title="Profile & Settings" description="Manage your WorkLink profile details, preferences, and verification state." />

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[36px]">
              <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
                <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-brand-600 text-2xl font-bold text-white shadow-glow">
                  {profileInitial}
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="blue">{roleSummary}</Badge>
                    <Badge tone={userProfile?.verified ? 'emerald' : 'amber'}>
                      {userProfile?.verified ? 'Verified profile' : 'Verification pending'}
                    </Badge>
                  </div>
                  <h1 className="mt-3 text-3xl font-bold text-slate-950">Profile and settings</h1>
                </div>
              </div>
            </Card>

            <Card className="rounded-[36px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Profile details</h2>
                </div>
                <Button onClick={saveProfile} disabled={savingProfile || !canSaveProfile}>
                  <CheckCircle2 size={16} />
                  {savingProfile ? 'Saving...' : 'Save profile'}
                </Button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InputField
                  label="Full name"
                  value={formValues.fullName}
                  onChange={(event) => updateFormValue('fullName', event.target.value)}
                  placeholder="Your full name"
                />
                <InputField
                  label="Phone number"
                  value={formValues.phoneNumber}
                  onChange={(event) => updateFormValue('phoneNumber', event.target.value)}
                  placeholder="+91 98765 43210"
                />
                <InputField
                  label="Email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => updateFormValue('email', event.target.value)}
                  placeholder="name@example.com"
                />
                {isClient ? (
                  <InputField
                    label="Location"
                    value={formValues.location}
                    onChange={(event) => updateFormValue('location', event.target.value)}
                    placeholder="Gachibowli, Hyderabad"
                  />
                ) : (
                  <InputField
                    label="Current location"
                    value={formValues.currentLocation}
                    onChange={(event) => updateFormValue('currentLocation', event.target.value)}
                    placeholder="Madhapur, Hyderabad"
                  />
                )}
              </div>

              {isLabour ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Work category"
                    placeholder="Select category"
                    value={formValues.category}
                    options={workCategories}
                    onChange={(event) => updateFormValue('category', event.target.value)}
                  />
                  <SelectField
                    label="Availability"
                    value={formValues.availability}
                    options={availabilityOptions}
                    onChange={(event) => updateFormValue('availability', event.target.value)}
                  />
                  <InputField
                    label="Skills"
                    value={formValues.skills}
                    onChange={(event) => updateFormValue('skills', event.target.value)}
                    placeholder="Electrician, CCTV installation, Internet/WiFi setup"
                    hint="Use commas to separate multiple skills."
                    className="md:col-span-2"
                  />
                  <InputField
                    label="Languages known"
                    value={formValues.languages}
                    onChange={(event) => updateFormValue('languages', event.target.value)}
                    placeholder={languageOptions.join(', ')}
                    hint="Use commas to separate multiple languages."
                    className="md:col-span-2"
                  />
                  <SelectField
                    label="Gender"
                    placeholder="Select gender"
                    value={formValues.gender}
                    options={['Male', 'Female', 'Other']}
                    onChange={(event) => updateFormValue('gender', event.target.value)}
                  />
                  <InputField
                    label="Age"
                    type="number"
                    value={formValues.age}
                    onChange={(event) => updateFormValue('age', event.target.value)}
                    placeholder="28"
                  />
                  <InputField
                    label="Education"
                    value={formValues.education}
                    onChange={(event) => updateFormValue('education', event.target.value)}
                    placeholder="SSC / ITI / Diploma / Degree"
                  />
                  <InputField
                    label="Experience (years)"
                    type="number"
                    value={formValues.experienceYears}
                    onChange={(event) => updateFormValue('experienceYears', event.target.value)}
                    placeholder="5"
                  />
                  <InputField
                    label="Expected daily wage"
                    type="number"
                    value={formValues.dailyWage}
                    onChange={(event) => updateFormValue('dailyWage', event.target.value)}
                    placeholder="1500"
                  />
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="About"
                      value={formValues.about}
                      onChange={(event) => updateFormValue('about', event.target.value)}
                      placeholder="Describe your work style, strengths, and preferred jobs."
                    />
                  </div>
                </div>
              ) : null}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Verification status</h2>
                  <p className="text-sm text-slate-600">Trust and account status.</p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm text-slate-700">
                <p>Name: {userProfile?.fullName || 'Not added'}</p>
                <p className="mt-2">Phone: {userProfile?.phoneNumber || 'Not added'}</p>
                <p className="mt-2">Email: {userProfile?.email || 'Not added'}</p>
                {isLabour ? <p className="mt-2">Category: {userProfile?.category || 'Not added'}</p> : null}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                  <UserRound size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Contact preferences</h2>
                  <p className="text-sm text-slate-600">Manage alerts.</p>
                </div>
              </div>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                {[
                  ['emailAlerts', 'Email alerts'],
                  ['whatsappAlerts', 'WhatsApp reminders']
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={preferences[key]}
                      onChange={(event) =>
                        setPreferences((prev) => ({ ...prev, [key]: event.target.checked }))
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="mt-6">
                <Button onClick={savePreferences} disabled={savingPreferences}>
                  {savingPreferences ? 'Saving...' : 'Save preferences'}
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-slate-950">Session</h2>
              <p className="mt-3 text-sm text-slate-600">Log out from your account.</p>
              <div className="mt-6">
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default SettingsPage;
