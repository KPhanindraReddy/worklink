import { Link, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Phone, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QuickBookingDialog } from '../../components/booking/QuickBookingDialog';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { PageSEO } from '../../components/common/PageSEO';
import { SectionHeading } from '../../components/common/SectionHeading';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { subscribeLabourById } from '../../services/labourService';
import { formatCurrency } from '../../utils/formatters';

const LabourProfilePage = () => {
  const { labourId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const [labour, setLabour] = useState(null);
  const [selectedQuickBookLabour, setSelectedQuickBookLabour] = useState(null);

  useEffect(() => {
    return subscribeLabourById(labourId, setLabour, () => setLabour(null));
  }, [labourId]);

  const isClient = userProfile?.role === 'client';
  const canRevealContact = Boolean(isClient && labour?.verified);
  const callButtonLabel = canRevealContact
    ? 'Call now'
    : isClient
      ? 'Labour verification required'
      : 'Client account required';

  if (!labour) {
    return (
      <AppShell>
        <div className="page-shell section-space">
          <EmptyState
            title="Labour profile not found"
            description="The requested profile is unavailable or may have been removed."
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageSEO title={labour.fullName} description={labour.about} />

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden rounded-[36px] p-0">
            <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr] md:p-8">
              <img
                src={labour.profilePhoto}
                alt={labour.fullName}
                className="h-56 w-full rounded-[28px] object-cover md:h-full"
              />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="blue">{labour.category}</Badge>
                  <Badge tone={labour.availability === 'Available' ? 'emerald' : 'amber'}>
                    {labour.availability}
                  </Badge>
                  <VerificationBadge verified={labour.verified} />
                </div>
                <h1 className="mt-5 font-display text-4xl font-bold text-slate-950 dark:text-white">
                  {labour.fullName}
                </h1>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Star size={15} className="text-amber-500" />
                    {labour.rating} rating
                  </span>
                  <span>{labour.experienceYears} years experience</span>
                  <span>{formatCurrency(labour.dailyWage)}/day</span>
                  <span>{labour.completedJobs} completed jobs</span>
                </div>
                <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-300">
                  {labour.about}
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin size={16} />
                  {labour.currentLocation}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {isClient ? (
                    <Button type="button" onClick={() => setSelectedQuickBookLabour(labour)}>
                      <CalendarDays size={16} />
                      Book now
                    </Button>
                  ) : currentUser ? (
                    <Button type="button" disabled>
                      Client account required
                    </Button>
                  ) : (
                    <Button as={Link} to="/auth?role=client&mode=signup">
                      Sign up as client to book
                    </Button>
                  )}
                  {isClient ? (
                    <Button as={Link} to={`/chat?target=${labour.id}`} variant="outline">
                      Chat now
                    </Button>
                  ) : currentUser ? (
                    <Button type="button" variant="outline" disabled>
                      Client account required
                    </Button>
                  ) : (
                    <Button as={Link} to="/auth?role=client&mode=login" variant="outline">
                      Login as client
                    </Button>
                  )}
                  <Button
                    as="a"
                    href={canRevealContact ? `tel:${labour.phoneNumber}` : undefined}
                    variant="outline"
                    className={!canRevealContact ? 'pointer-events-none opacity-60' : ''}
                  >
                    <Phone size={16} />
                    {callButtonLabel}
                  </Button>
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Direct phone access unlocks after the labour profile is verified.
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Skills and languages</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {labour.skills?.map((item) => (
                  <Badge key={item} tone="slate">
                    {item}
                  </Badge>
                ))}
              </div>
              <h3 className="mt-6 font-semibold text-slate-950 dark:text-white">Languages</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {labour.languages?.map((item) => (
                  <Badge key={item} tone="blue">
                    {item}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Profile details</h2>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Gender: {labour.gender}</p>
                <p>Age: {labour.age}</p>
                <p>Education: {labour.education}</p>
                <p>Response time: {labour.responseTime}</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card>
            <SectionHeading
              eyebrow="Portfolio"
              title="Work photos"
              description="Recent work samples and client-facing proof of craftsmanship."
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(labour.portfolio ?? []).map((item) => (
                <img key={item} src={item} alt="Work sample" className="h-52 w-full rounded-3xl object-cover" />
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeading
              eyebrow="Work history"
              title="Completed jobs"
              description="Recent jobs with payment and location details."
            />
            <div className="mt-6 space-y-4">
              {(labour.previousWorkHistory ?? []).map((job) => (
                <div key={`${job.title}-${job.date}`} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-950 dark:text-white">{job.title}</h3>
                    <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">
                      {formatCurrency(job.amountPaid)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {job.location} - {job.date}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Reviews"
            title="Client feedback and ratings"
            description="Ratings and comments from recent clients."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {(labour.reviews ?? []).map((review) => (
              <Card key={review.id}>
                <div className="flex items-center gap-2 text-amber-500">
                  <Star size={16} fill="currentColor" />
                  <span className="font-semibold text-slate-900 dark:text-white">{review.rating}</span>
                </div>
                <p className="mt-4 text-base text-slate-700 dark:text-slate-200">{review.comment}</p>
                <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {review.clientName}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <QuickBookingDialog
        isOpen={Boolean(selectedQuickBookLabour)}
        labour={selectedQuickBookLabour}
        defaultService={selectedQuickBookLabour?.category ?? labour.category}
        defaultBudget={selectedQuickBookLabour?.dailyWage ?? labour.dailyWage}
        onClose={() => setSelectedQuickBookLabour(null)}
      />
    </AppShell>
  );
};

export default LabourProfilePage;
