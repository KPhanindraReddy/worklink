import { Mic, Search } from 'lucide-react';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';

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
    className="glass-panel grid gap-3 rounded-[28px] p-3 shadow-glow sm:grid-cols-[1fr_auto_auto]"
  >
    <InputField
      aria-label="Search labour"
      value={query}
      placeholder={placeholder}
      className="sm:col-span-1"
      onChange={(event) => onQueryChange(event.target.value)}
    />
    <Button type="button" variant="outline" onClick={onVoiceSearch} className="sm:h-full">
      <Mic size={16} />
      {isListening ? 'Listening...' : 'Voice'}
    </Button>
    <Button type="submit" className="sm:h-full">
      <Search size={16} />
      Search
    </Button>
  </form>
);
