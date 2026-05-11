import { History, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { PageSEO } from '../../components/common/PageSEO';
import { Skeleton } from '../../components/common/Skeleton';
import { TextAreaField } from '../../components/common/TextAreaField';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { subscribeBookingsForUser } from '../../services/bookingService';
import { submitServiceReview } from '../../services/reviewService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const getStatusTone = (status) => {
  if (['accepted', 'in_progress'].includes(status)) {
    return 'emerald';
  }

  if (status === 'completed') {
    return 'blue';
  }

  if (['rejected', 'cancelled'].includes(status)) {
    return 'rose';
  }

  if (status === 'timed_out') {
    return 'slate';
  }

  return 'amber';
};

const formatStatusLabel = (status) =>
  String(status || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const RecentServicesPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [submittingReviewId, setSubmittingReviewId] = useState('');
  const role = userProfile?.role === 'labour' ? 'labour' : 'client';
  const subjectLabel = role === 'labour' ? 'Client' : 'Worker';

  useEffect(() => {
    if (!currentUser?.uid) {
      setBookings([]);
      setBookingsLoading(false);
      return undefined;
    }

    setBookingsLoading(true);
    return subscribeBookingsForUser(
      { userId: currentUser.uid, role },
      (nextBookings) => {
        setBookings(nextBookings);
        setBookingsLoading(false);
      },
      (error) => {
        setBookingsLoading(false);
        toast.error(getFirebaseErrorMessage(error));
      }
    );
  }, [currentUser?.uid, role]);

  const summaryItems = useMemo(
    () => [
      {
        label: 'New requests',
        value: bookings.filter((item) => item.status === 'pending').length
      },
      {
        label: 'Active',
        value: bookings.filter((item) => ['accepted', 'in_progress'].includes(item.status)).length
      },
      {
        label: 'Completed',
        value: bookings.filter((item) => item.status === 'completed').length
      },
      {
        label: 'Declined',
        value: bookings.filter((item) => ['rejected', 'cancelled', 'timed_out'].includes(item.status)).length
      }
    ],
    [bookings]
  );

  const updateReviewDraft = (bookingId, key, value) =>
    setReviewDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] ?? {}),
        [key]: value
      }
    }));

  const handleSubmitReview = async (booking) => {
    const draft = reviewDrafts[booking.id] ?? {};

    if (!draft.rating) {
      toast.error('Choose a star rating before submitting.');
      return;
    }

    setSubmittingReviewId(booking.id);

    try {
      await submitServiceReview({
        bookingId: booking.id,
        clientId: currentUser.uid,
        clientName: userProfile?.fullName,
        rating: draft.rating,
        comment: draft.comment
      });
      setReviewDrafts((prev) => {
        const next = { ...prev };
        delete next[booking.id];
        return next;
      });
      toast.success('Thanks for rating this service.');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSubmittingReviewId('');
    }
  };

  return (
    <AppShell>
      <PageSEO
        title="Recent Services"
        description="View your recent service requests, completed work, and current booking status."
      />

      <section className="section-space">
        <div className="page-shell space-y-5">
          <Card className="rounded-[28px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                  <History size={18} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-950">Recent services</h1>
                  <p className="text-[13px] text-slate-500">
                    Track service requests and completed work.
                  </p>
                </div>
              </div>
              {bookingsLoading ? <Skeleton className="h-7 w-20" /> : <Badge tone="slate">{bookings.length} total</Badge>}
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryItems.map((item) => (
              <Card key={item.label} className="rounded-[24px]">
                <p className="text-[12px] text-slate-500">{item.label}</p>
                {bookingsLoading ? (
                  <Skeleton className="mt-3 h-8 w-16" />
                ) : (
                  <p className="mt-2 font-display text-2xl font-bold text-slate-950">{item.value}</p>
                )}
              </Card>
            ))}
          </div>

          {bookingsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : bookings.length ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Card key={booking.id} className="rounded-[28px]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-950">{booking.serviceType}</h2>
                      <p className="mt-1 text-[13px] text-slate-500">
                        {subjectLabel}: {role === 'labour' ? booking.clientName : booking.labourName}
                      </p>
                    </div>
                    <Badge tone={getStatusTone(booking.status)}>
                      {formatStatusLabel(booking.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-2 text-[13px] text-slate-600 md:grid-cols-3">
                    <p>{formatDate(booking.appointmentAt)}</p>
                    <p>{formatCurrency(booking.amount)}</p>
                    <p>{booking.location || 'Location shared after confirmation'}</p>
                  </div>

                  {booking.serviceDetails ? (
                    <p className="mt-3 text-[13px] leading-6 text-slate-600">{booking.serviceDetails}</p>
                  ) : null}

                  {booking.status === 'accepted' && booking.startOtp ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Start OTP
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-950">{booking.startOtp}</p>
                    </div>
                  ) : null}

                  {role === 'client' && booking.status === 'completed' ? (
                    booking.reviewRating ? (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-amber-800">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              size={16}
                              fill={index < Number(booking.reviewRating) ? 'currentColor' : 'none'}
                            />
                          ))}
                          Rated {booking.reviewRating}/5
                        </div>
                        {booking.reviewComment ? (
                          <p className="mt-2 text-[13px] leading-6 text-amber-950">
                            {booking.reviewComment}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-950">Rate this service</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Array.from({ length: 5 }).map((_, index) => {
                            const value = index + 1;
                            const selected = Number(reviewDrafts[booking.id]?.rating ?? 0) >= value;

                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => updateReviewDraft(booking.id, 'rating', value)}
                                className={`grid h-10 w-10 place-items-center rounded-xl border transition ${
                                  selected
                                    ? 'border-amber-300 bg-amber-100 text-amber-600'
                                    : 'border-slate-200 bg-white text-slate-400 hover:border-amber-200 hover:text-amber-500'
                                }`}
                                aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                              >
                                <Star size={18} fill={selected ? 'currentColor' : 'none'} />
                              </button>
                            );
                          })}
                        </div>
                        <TextAreaField
                          label="Review"
                          value={reviewDrafts[booking.id]?.comment ?? ''}
                          onChange={(event) =>
                            updateReviewDraft(booking.id, 'comment', event.target.value)
                          }
                          placeholder="Share a short note about the service."
                          className="mt-3"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3"
                          disabled={submittingReviewId === booking.id}
                          onClick={() => handleSubmitReview(booking)}
                        >
                          {submittingReviewId === booking.id ? 'Submitting...' : 'Submit rating'}
                        </Button>
                      </div>
                    )
                  ) : null}
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No recent services yet"
              description="Your latest service requests and completed work will appear here."
              action={
                role === 'client' ? (
                  <Button as={Link} to="/search" size="sm">
                    Search labour
                  </Button>
                ) : null
              }
            />
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default RecentServicesPage;
