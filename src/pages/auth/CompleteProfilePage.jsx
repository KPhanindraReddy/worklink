import { BriefcaseBusiness, MapPin, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { PageSEO } from '../../components/common/PageSEO';
import { SelectField } from '../../components/common/SelectField';
import { TextAreaField } from '../../components/common/TextAreaField';
import { ProfileLocationPanel } from '../../components/location/ProfileLocationPanel';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { routeByRole, isProfileComplete } from '../../utils/authFlow';
import {
  availabilityOptions,
  languageOptions,
  roles,
  workCategories
} from '../../utils/constants';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const initialFormState = {
  fullName: '',
  phoneNumber: '',
  email: '',
  gender: '',
  age: '',
  education: '',
  experienceYears: '',
  category: '',
  skills: '',
  languages: '',
  currentLocation: '',
  location: '',
  coordinates: null,
  about: '',
  availability: 'Available',
  dailyWage: '',
  previousWorkHistory: '',
  role: 'labour'
};

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    currentUser,
    userProfile,
    createOrUpdateUserProfile,
    logout
  } = useAuth();

  const queryRole = searchParams.get('role');
  const [role, setRole] = useState(queryRole || userProfile?.role || 'labour');
  const [formValues, setFormValues] = useState({
    ...initialFormState,
    role: queryRole || userProfile?.role || 'labour'
  });
  const [submitting, setSubmitting] = useState(false);
  const isRoleLocked = Boolean(userProfile?.role && userProfile.role !== 'admin');

  useEffect(() => {
    if (isProfileComplete(userProfile)) {
      navigate(routeByRole(userProfile.role), { replace: true });
    }
  }, [navigate, userProfile]);

  useEffect(() => {
    const resolvedRole = userProfile?.role || queryRole || 'labour';

    setRole(resolvedRole);
    setFormValues((prev) => ({
      ...prev,
      role: resolvedRole,
      fullName: prev.fullName || userProfile?.fullName || currentUser?.displayName || '',
      phoneNumber: prev.phoneNumber || userProfile?.phoneNumber || currentUser?.phoneNumber || '',
      email: prev.email || userProfile?.email || currentUser?.email || '',
      currentLocation: prev.currentLocation || userProfile?.location || '',
      location: prev.location || userProfile?.location || '',
      coordinates: prev.coordinates || userProfile?.coordinates || null
    }));
  }, [
    currentUser?.displayName,
    currentUser?.email,
    currentUser?.phoneNumber,
    queryRole,
    userProfile?.fullName,
    userProfile?.location,
    userProfile?.phoneNumber,
    userProfile?.coordinates,
    userProfile?.email,
    userProfile?.role
  ]);

  const handleChange = (key, value) =>
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'role' ? { role: value } : {})
    }));

  const canSaveProfile =
    role === 'labour'
      ? Boolean(
          formValues.fullName.trim() &&
            (formValues.phoneNumber.trim() || formValues.email.trim()) &&
            formValues.category &&
            formValues.skills.trim() &&
            (formValues.currentLocation.trim() || formValues.coordinates)
        )
      : Boolean(
          formValues.fullName.trim() &&
            (formValues.phoneNumber.trim() || formValues.email.trim()) &&
            (formValues.location.trim() || formValues.coordinates)
        );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser) {
      toast.error('Login is required before completing your profile.');
      return;
    }

    setSubmitting(true);
    try {
      await createOrUpdateUserProfile(currentUser, {
        ...formValues,
        role,
        location: role === 'client' ? formValues.location : formValues.currentLocation,
        currentLocation: role === 'labour' ? formValues.currentLocation : '',
        coordinates: formValues.coordinates
      });

      toast.success('Profile completed successfully.');
      navigate(routeByRole(role), { replace: true });
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageSEO
        title="Complete Profile"
        description="Finish your labour or client profile after login so WorkLink can unlock dashboard access."
      />

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="surface-card rounded-[36px] p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                <UserRound size={16} />
                Profile completion
              </div>
              <h1 className="mt-6 font-display text-4xl font-bold text-slate-950">
                One last step before the dashboard.
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Your account is already authenticated. Add the details WorkLink needs for matching, booking, chat visibility, and trusted hiring.
              </p>
            </div>

            <div className="surface-card rounded-[36px] p-6">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <BriefcaseBusiness size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">What happens after this</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Labour users unlock availability, jobs, chat, earnings, and reviews. Clients unlock search, booking, favourites, and hiring history.
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-card rounded-[36px] p-6">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Tip</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Use a real service location and a clear skill category so the search page and recommendations can show you correctly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card className="rounded-[36px] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold text-slate-950">Complete your profile</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Save the role-specific details that should appear after login.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await logout();
                  navigate('/auth', { replace: true });
                }}
              >
                Use another account
              </Button>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-900">Profile type</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {roles.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant={role === item.value ? 'primary' : 'outline'}
                    disabled={isRoleLocked && role !== item.value}
                    onClick={() => {
                      if (isRoleLocked) {
                        return;
                      }

                      setRole(item.value);
                      handleChange('role', item.value);
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Full name"
                  value={formValues.fullName}
                  onChange={(event) => handleChange('fullName', event.target.value)}
                  placeholder="Your full name"
                />
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
                {role === 'client' ? (
                  <div className="space-y-3">
                    <InputField
                      label="Location"
                      value={formValues.location}
                      onChange={(event) => handleChange('location', event.target.value)}
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
                      onChange={(event) => handleChange('currentLocation', event.target.value)}
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
              </div>

              {role === 'labour' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Work category"
                    placeholder="Select category"
                    value={formValues.category}
                    options={workCategories}
                    onChange={(event) => handleChange('category', event.target.value)}
                  />
                  <SelectField
                    label="Availability"
                    value={formValues.availability}
                    options={availabilityOptions}
                    onChange={(event) => handleChange('availability', event.target.value)}
                  />
                  <InputField
                    label="Skills"
                    value={formValues.skills}
                    onChange={(event) => handleChange('skills', event.target.value)}
                    placeholder="Electrician, CCTV installation, Internet/WiFi setup"
                    hint="Use commas to separate multiple skills."
                    className="md:col-span-2"
                  />
                  <InputField
                    label="Languages known"
                    value={formValues.languages}
                    onChange={(event) => handleChange('languages', event.target.value)}
                    placeholder={languageOptions.join(', ')}
                    hint="Use commas to separate multiple languages."
                    className="md:col-span-2"
                  />
                  <SelectField
                    label="Gender"
                    placeholder="Select gender"
                    value={formValues.gender}
                    options={['Male', 'Female', 'Other']}
                    onChange={(event) => handleChange('gender', event.target.value)}
                  />
                  <InputField
                    label="Age"
                    type="number"
                    value={formValues.age}
                    onChange={(event) => handleChange('age', event.target.value)}
                    placeholder="28"
                  />
                  <InputField
                    label="Education"
                    value={formValues.education}
                    onChange={(event) => handleChange('education', event.target.value)}
                    placeholder="SSC / ITI / Diploma / Degree"
                  />
                  <InputField
                    label="Experience (years)"
                    type="number"
                    value={formValues.experienceYears}
                    onChange={(event) => handleChange('experienceYears', event.target.value)}
                    placeholder="5"
                  />
                  <InputField
                    label="Expected daily wage"
                    type="number"
                    value={formValues.dailyWage}
                    onChange={(event) => handleChange('dailyWage', event.target.value)}
                    placeholder="1500"
                  />
                  <div className="md:col-span-2" />
                  <TextAreaField
                    label="About"
                    value={formValues.about}
                    onChange={(event) => handleChange('about', event.target.value)}
                    placeholder="Describe your work style, strengths, and preferred jobs."
                    className="md:col-span-2"
                  />
                  <TextAreaField
                    label="Previous work history"
                    value={formValues.previousWorkHistory}
                    onChange={(event) => handleChange('previousWorkHistory', event.target.value)}
                    placeholder="Apartment rewiring, RO repair, CCTV setup..."
                    className="md:col-span-2"
                  />
                </div>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={submitting || !canSaveProfile}>
                {submitting ? 'Saving profile...' : 'Save and continue'}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </AppShell>
  );
};

export default CompleteProfilePage;
