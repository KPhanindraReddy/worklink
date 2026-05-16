import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut, Pencil, UserRound, X } from 'lucide-react';
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
import { availabilityOptions, languageOptions, workCategories } from '../../utils/constants';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const toCommaText = (value) => (Array.isArray(value) ? value.join(', ') : value || '');

const buildProfileForm = (profile, currentUser) => ({
  fullName: profile?.fullName || currentUser?.displayName || '',
  phoneNumber: profile?.phoneNumber || currentUser?.phoneNumber || '',
  email: profile?.email || currentUser?.email || '',
  location: profile?.location || '',
  currentLocation: profile?.currentLocation || profile?.location || '',
  coordinates: profile?.coordinates || null,
  category: profile?.category || '',
  skills: toCommaText(profile?.skills),
  languages: toCommaText(profile?.languages),
  gender: profile?.gender || '',
  age: profile?.age ?? '',
  education: profile?.education || '',
  experienceYears: profile?.experienceYears ?? '',
  dailyWage: profile?.dailyWage ?? '',
  availability: profile?.availability || 'Available',
  about: profile?.about || '',
  previousWorkHistory: toCommaText(profile?.previousWorkHistory)
});

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, createOrUpdateUserProfile, logout } = useAuth();
  const [formValues, setFormValues] = useState(() => buildProfileForm(userProfile, currentUser));
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setFormValues(buildProfileForm(userProfile, currentUser));
    }
  }, [currentUser, isEditing, userProfile]);

  const isLabour = userProfile?.role === 'labour';
  const isClient = userProfile?.role === 'client';
  const roleSummary = useMemo(
    () => (userProfile?.role ? `${userProfile.role} account` : 'Profile'),
    [userProfile?.role]
  );
  const profileInitial = useMemo(
    () => (userProfile?.fullName || currentUser?.displayName || 'U').trim().charAt(0).toUpperCase(),
    [currentUser?.displayName, userProfile?.fullName]
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
      : Boolean(formValues.fullName.trim() && (formValues.phoneNumber.trim() || formValues.email.trim()));
  const profileFieldsDisabled = !isEditing || savingProfile;

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
        about: isLabour ? formValues.about : '',
        previousWorkHistory: isLabour ? formValues.previousWorkHistory : ''
      });
      toast.success('Profile updated successfully.');
      setIsEditing(false);
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelProfileEdit = () => {
    setFormValues(buildProfileForm(userProfile, currentUser));
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  return (
    <AppShell>
      <PageSEO title="Profile & Settings" description="Manage your WorkLink profile details." />

      <section className="section-space">
        <div className="page-shell max-w-[920px] space-y-5">
          <Card className="rounded-[30px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-brand-600 text-xl font-bold text-white shadow-glow">
                  {profileInitial}
                </div>
                <div className="min-w-0">
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
                  <h1 className="mt-2 break-words text-xl font-bold text-slate-950 sm:text-2xl">
                    {formValues.fullName.trim() || 'Profile'}
                  </h1>
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      onClick={cancelProfileEdit}
                      disabled={savingProfile}
                    >
                      <X size={16} />
                      Cancel
                    </Button>
                    <Button className="flex-1 sm:flex-none" onClick={saveProfile} disabled={savingProfile || !canSaveProfile}>
                      <CheckCircle2 size={16} />
                      {savingProfile ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 rounded-full p-0"
                    onClick={() => setIsEditing(true)}
                    aria-label="Edit profile details"
                    title="Edit profile"
                  >
                    <Pencil size={17} />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-[30px]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                <UserRound size={18} />
              </div>
              <h2 className="text-xl font-semibold text-slate-950">Personal details</h2>
            </div>

            <div className="mt-5 space-y-4">
              <InputField
                label="Full name"
                disabled={profileFieldsDisabled}
                value={formValues.fullName}
                onChange={(event) => updateFormValue('fullName', event.target.value)}
                placeholder="Your full name"
              />
              <InputField
                label="Phone number"
                disabled={profileFieldsDisabled}
                value={formValues.phoneNumber}
                onChange={(event) => updateFormValue('phoneNumber', event.target.value)}
                placeholder="+91 98765 43210"
              />
              <InputField
                label="Email"
                type="email"
                disabled={profileFieldsDisabled}
                value={formValues.email}
                onChange={(event) => updateFormValue('email', event.target.value)}
                placeholder="name@example.com"
              />
              <SelectField
                label="Gender"
                placeholder="Select gender"
                disabled={profileFieldsDisabled}
                value={formValues.gender}
                options={['Male', 'Female', 'Other']}
                onChange={(event) => updateFormValue('gender', event.target.value)}
              />
              <InputField
                label="Age"
                type="number"
                disabled={profileFieldsDisabled}
                value={formValues.age}
                onChange={(event) => updateFormValue('age', event.target.value)}
                placeholder="28"
              />
            </div>
          </Card>

          <Card className="rounded-[30px]">
            <h2 className="text-xl font-semibold text-slate-950">
              {isClient ? 'Location' : 'Current location'}
            </h2>
            <div className="mt-5 space-y-3">
              {isClient ? (
                <>
                  <InputField
                    label="Location"
                    disabled={profileFieldsDisabled}
                    value={formValues.location}
                    onChange={(event) => updateFormValue('location', event.target.value)}
                    placeholder="Gachibowli, Hyderabad"
                  />
                  <ProfileLocationPanel
                    roleLabel="client"
                    locationValue={formValues.location}
                    savedCoordinates={formValues.coordinates}
                    disabled={profileFieldsDisabled}
                    onApplyLocation={({ label, coordinates }) =>
                      setFormValues((prev) => ({
                        ...prev,
                        location: prev.location.trim() || label,
                        coordinates
                      }))
                    }
                  />
                </>
              ) : (
                <>
                  <InputField
                    label="Current location"
                    disabled={profileFieldsDisabled}
                    value={formValues.currentLocation}
                    onChange={(event) => updateFormValue('currentLocation', event.target.value)}
                    placeholder="Madhapur, Hyderabad"
                  />
                  <ProfileLocationPanel
                    roleLabel="labour"
                    locationValue={formValues.currentLocation}
                    savedCoordinates={formValues.coordinates}
                    disabled={profileFieldsDisabled}
                    onApplyLocation={({ label, coordinates }) =>
                      setFormValues((prev) => ({
                        ...prev,
                        currentLocation: prev.currentLocation.trim() || label,
                        coordinates
                      }))
                    }
                  />
                </>
              )}
            </div>
          </Card>

          {isLabour ? (
            <Card className="rounded-[30px]">
              <h2 className="text-xl font-semibold text-slate-950">Work details</h2>
              <div className="mt-5 space-y-4">
                <SelectField
                  label="Work category"
                  placeholder="Select category"
                  disabled={profileFieldsDisabled}
                  value={formValues.category}
                  options={workCategories}
                  onChange={(event) => updateFormValue('category', event.target.value)}
                />
                <SelectField
                  label="Availability"
                  disabled={profileFieldsDisabled}
                  value={formValues.availability}
                  options={availabilityOptions}
                  onChange={(event) => updateFormValue('availability', event.target.value)}
                />
                <InputField
                  label="Skills"
                  disabled={profileFieldsDisabled}
                  value={formValues.skills}
                  onChange={(event) => updateFormValue('skills', event.target.value)}
                  placeholder="Electrician, CCTV installation, Internet/WiFi setup"
                  hint="Use commas to separate multiple skills."
                />
                <InputField
                  label="Languages known"
                  disabled={profileFieldsDisabled}
                  value={formValues.languages}
                  onChange={(event) => updateFormValue('languages', event.target.value)}
                  placeholder={languageOptions.join(', ')}
                  hint="Use commas to separate multiple languages."
                />
                <InputField
                  label="Education"
                  disabled={profileFieldsDisabled}
                  value={formValues.education}
                  onChange={(event) => updateFormValue('education', event.target.value)}
                  placeholder="SSC / ITI / Diploma / Degree"
                />
                <InputField
                  label="Experience (years)"
                  type="number"
                  disabled={profileFieldsDisabled}
                  value={formValues.experienceYears}
                  onChange={(event) => updateFormValue('experienceYears', event.target.value)}
                  placeholder="5"
                />
                <InputField
                  label="Minimum budget"
                  type="number"
                  disabled={profileFieldsDisabled}
                  value={formValues.dailyWage}
                  onChange={(event) => updateFormValue('dailyWage', event.target.value)}
                  placeholder="1500"
                />
                <TextAreaField
                  label="About"
                  disabled={profileFieldsDisabled}
                  value={formValues.about}
                  onChange={(event) => updateFormValue('about', event.target.value)}
                  placeholder="Describe your work style, strengths, and preferred jobs."
                />
                <TextAreaField
                  label="Previous work history"
                  disabled={profileFieldsDisabled}
                  value={formValues.previousWorkHistory}
                  onChange={(event) => updateFormValue('previousWorkHistory', event.target.value)}
                  placeholder="Apartment rewiring, RO repair, CCTV setup..."
                />
              </div>
            </Card>
          ) : null}

          <Card className="rounded-[30px]">
            <h2 className="text-xl font-semibold text-slate-950">Settings</h2>
            <div className="mt-5 grid gap-4 rounded-2xl bg-slate-50 px-4 py-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-600">Signed in to WorkLink</p>
              <Button variant="danger" className="w-full sm:w-auto" onClick={handleLogout}>
                <LogOut size={16} />
                Sign out
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
};

export default SettingsPage;
