import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, UserRound } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { PageSEO } from '../../components/common/PageSEO';
import { SelectField } from '../../components/common/SelectField';
import { TextAreaField } from '../../components/common/TextAreaField';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import { ProfileLocationPanel } from '../../components/location/ProfileLocationPanel';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { updateUserSettings } from '../../services/userService';
import { availabilityOptions, languageOptions, workCategories } from '../../utils/constants';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';
import { getLocationLabel } from '../../utils/location';

const buildProfileForm = (profile, currentUser) => ({
  fullName: profile?.fullName || currentUser?.displayName || '',
  phoneNumber: profile?.phoneNumber || currentUser?.phoneNumber || '',
  email: profile?.email || currentUser?.email || '',
  location: profile?.location || '',
  currentLocation: profile?.currentLocation || profile?.location || '',
  coordinates: profile?.coordinates || null,
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
  const isLabour = userProfile?.role === 'labour';
  const isClient = userProfile?.role === 'client';
  const locationValue = useMemo(
    () =>
      getLocationLabel(
        {
          location: isClient ? formValues.location : userProfile?.location,
          currentLocation: isClient ? userProfile?.currentLocation : formValues.currentLocation,
          coordinates: formValues.coordinates || userProfile?.coordinates
        },
        {
          preferCurrent: isLabour,
          fallback: 'Not added'
        }
      ),
    [
      formValues.coordinates,
      formValues.currentLocation,
      formValues.location,
      isClient,
      userProfile?.currentLocation,
      userProfile?.location,
      userProfile?.coordinates,
      isLabour
    ]
  );
  const profileInitial = useMemo(
    () => (userProfile?.fullName || currentUser?.displayName || 'U').trim().charAt(0).toUpperCase(),
    [currentUser?.displayName, userProfile?.fullName]
  );
  const summaryItems = useMemo(
    () => [
      { label: 'Name', value: formValues.fullName.trim() || 'Not added' },
      { label: 'Age', value: formValues.age || 'Not added' },
      { label: 'Phone', value: formValues.phoneNumber.trim() || 'Not added' },
      { label: 'Email', value: formValues.email.trim() || 'Not added' },
      { label: isClient ? 'Location' : 'Current location', value: locationValue },
      { label: 'Gender', value: formValues.gender || 'Not added' },
      ...(isLabour
        ? [
            { label: 'Category', value: formValues.category || 'Not added' },
            {
              label: 'Experience',
              value: formValues.experienceYears ? `${formValues.experienceYears} years` : 'Not added'
            },
            { label: 'Daily wage', value: formValues.dailyWage || 'Not added' },
            { label: 'Availability', value: formValues.availability || 'Not added' }
          ]
        : [])
    ],
    [
      formValues.age,
      formValues.availability,
      formValues.category,
      formValues.dailyWage,
      formValues.email,
      formValues.experienceYears,
      formValues.fullName,
      formValues.gender,
      formValues.phoneNumber,
      isClient,
      isLabour,
      locationValue
    ]
  );
  const canSaveProfile = isLabour
    ? Boolean(
          formValues.fullName.trim() &&
          (formValues.phoneNumber.trim() || formValues.email.trim()) &&
          (formValues.currentLocation.trim() || formValues.coordinates) &&
          formValues.category &&
          formValues.skills.trim()
      )
    : isClient
      ? Boolean(
          formValues.fullName.trim() &&
            (formValues.phoneNumber.trim() || formValues.email.trim()) &&
            (formValues.location.trim() || formValues.coordinates)
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
        coordinates: formValues.coordinates,
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
      <PageSEO title="Profile & Settings" description="Manage your WorkLink profile details and preferences." />

      <section className="section-space">
        <div className="page-shell grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[30px]">
              <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
                <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-brand-600 text-xl font-bold text-white shadow-glow">
                  {profileInitial}
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="blue">{roleSummary}</Badge>
                    {isLabour ? (
                      <VerificationBadge
                        verified={userProfile?.verified}
                        verifiedLabel="Verified profile"
                        pendingLabel="Not verified"
                      />
                    ) : null}
                  </div>
                  <h1 className="mt-2 text-2xl font-bold text-slate-950">
                    {formValues.fullName.trim() || 'Profile'}
                  </h1>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Personal details first, settings below.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[30px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Profile details</h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Update your name, age, contact, and account information.
                  </p>
                </div>
                <Button onClick={saveProfile} disabled={savingProfile || !canSaveProfile}>
                  <CheckCircle2 size={16} />
                  {savingProfile ? 'Saving...' : 'Save profile'}
                </Button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                  <div className="space-y-3">
                    <InputField
                      label="Location"
                      value={formValues.location}
                      onChange={(event) => updateFormValue('location', event.target.value)}
                      placeholder="Gachibowli, Hyderabad"
                    />
                    <ProfileLocationPanel
                      roleLabel="client"
                      locationValue={formValues.location}
                      savedCoordinates={formValues.coordinates}
                      onApplyLocation={({ label, coordinates }) =>
                        setFormValues((prev) => ({
                          ...prev,
                          location: prev.location.trim() || label,
                          coordinates
                        }))
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <InputField
                      label="Current location"
                      value={formValues.currentLocation}
                      onChange={(event) => updateFormValue('currentLocation', event.target.value)}
                      placeholder="Madhapur, Hyderabad"
                    />
                    <ProfileLocationPanel
                      roleLabel="labour"
                      locationValue={formValues.currentLocation}
                      savedCoordinates={formValues.coordinates}
                      onApplyLocation={({ label, coordinates }) =>
                        setFormValues((prev) => ({
                          ...prev,
                          currentLocation: prev.currentLocation.trim() || label,
                          coordinates
                        }))
                      }
                    />
                  </div>
                )}
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
              </div>

              {isLabour ? (
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <h3 className="text-base font-semibold text-slate-950">Work details</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                </div>
              ) : null}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[30px]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                  <UserRound size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Profile summary</h2>
                  <p className="text-[13px] text-slate-500">Arranged account details.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {summaryItems.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[30px]">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                  <UserRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Settings</h2>
                  <p className="text-[13px] text-slate-500">Notification preferences.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
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

            <Card className="rounded-[30px]">
              <h2 className="text-lg font-semibold text-slate-950">Session</h2>
              <p className="mt-2 text-[13px] text-slate-500">Log out when you finish.</p>
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
