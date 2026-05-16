import { CalendarDays, Clock3 } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

const defaultSlots = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '04:30 PM', '06:00 PM'];

export const BookingCalendar = ({
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
  slots = defaultSlots
}) => (
  <Card className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr]">
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-brand-600">
        <CalendarDays size={18} />
        <p className="font-semibold">Pick a date</p>
      </div>
      <input
        type="date"
        value={selectedDate}
        min={new Date().toISOString().slice(0, 10)}
        onChange={(event) => onDateChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-brand-500/20"
      />
    </div>
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-brand-600">
        <Clock3 size={18} />
        <p className="font-semibold">Select a time slot</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => (
          <Button
            key={slot}
            type="button"
            variant={slot === selectedSlot ? 'primary' : 'outline'}
            className="w-full"
            onClick={() => onSlotChange(slot)}
          >
            {slot}
          </Button>
        ))}
      </div>
    </div>
  </Card>
);
