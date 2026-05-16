import { Mic, Search } from 'lucide-react';
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
    className="w-full max-w-full overflow-hidden rounded-[20px] border border-white/80 bg-white/90 p-2 shadow-soft backdrop-blur-xl sm:rounded-[32px] sm:p-3"
  >
    <div className="flex min-w-0 flex-col gap-2 rounded-[18px] border border-slate-200 bg-slate-50/90 p-2 sm:flex-row sm:items-center sm:gap-3 sm:rounded-[28px]">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white px-2.5 py-3 shadow-sm sm:gap-3 sm:rounded-[24px] sm:px-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-slate-950 text-white sm:h-12 sm:w-12">
          <Search size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-[11px] sm:tracking-[0.24em]">
            Search locally
          </span>
          <input
            aria-label="Search labour"
            value={query}
            placeholder={placeholder}
            className="mt-1 w-full min-w-0 border-0 bg-transparent p-0 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 sm:text-lg"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </span>
      </label>

      <div className="grid min-w-0 gap-2 sm:grid-cols-[auto_auto]">
        <Button
          type="button"
          variant="ghost"
          onClick={onVoiceSearch}
          className="h-12 rounded-[18px] bg-white px-4 text-slate-700 hover:bg-slate-100 sm:h-14 sm:rounded-[22px]"
        >
          <Mic size={18} />
          <span className="whitespace-nowrap">{isListening ? 'Listening...' : 'Voice'}</span>
        </Button>
        <Button type="submit" className="h-12 rounded-[18px] px-6 text-base sm:h-14 sm:rounded-[22px]">
          <Search size={18} />
          Search
        </Button>
      </div>
    </div>
  </form>
);
