import { Mic, Search, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

export const HeroSearch = ({
  query,
  onQueryChange,
  onSearch,
  onVoiceSearch,
  isListening,
  placeholder
}) => (
  <form
    onSubmit={onSearch}
    className="rounded-[32px] border border-white/80 bg-white/90 p-3 shadow-soft backdrop-blur-xl"
  >
    <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-slate-50/90 p-2 sm:flex-row sm:items-center">
      <label className="flex min-w-0 flex-1 items-center gap-3 rounded-[24px] bg-white px-3 py-3 shadow-sm">
        <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-slate-950 text-white">
          <Search size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Search locally
          </span>
          <input
            aria-label="Search labour"
            value={query}
            placeholder={placeholder}
            className="mt-1 w-full border-0 bg-transparent p-0 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 sm:text-lg"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </span>
      </label>

      <div className="grid gap-2 sm:grid-cols-[auto_auto]">
        <Button
          type="button"
          variant="ghost"
          onClick={onVoiceSearch}
          className="h-14 rounded-[22px] bg-white px-4 text-slate-700 hover:bg-slate-100"
        >
          <Mic size={18} />
          <span className="whitespace-nowrap">{isListening ? 'Listening...' : 'Voice'}</span>
        </Button>
        <Button type="submit" className="h-14 rounded-[22px] px-6 text-base">
          <Search size={18} />
          Search
        </Button>
      </div>
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-2 px-2 text-xs font-medium text-slate-500 sm:text-sm">
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-brand-700">
        <Sparkles size={14} />
        Verified workers, instant chat, and secure job-start confirmation
      </span>
    </div>
  </form>
);
