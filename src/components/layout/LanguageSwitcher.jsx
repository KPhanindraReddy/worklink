import i18n from '../../i18n';
import { SelectField } from '../common/SelectField';

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Telugu', value: 'te' }
];

export const LanguageSwitcher = () => (
  <div className="w-28">
    <SelectField
      aria-label="Select language"
      value={i18n.language}
      options={languageOptions}
      onChange={(event) => {
        i18n.changeLanguage(event.target.value);
        window.localStorage.setItem('worklink-lang', event.target.value);
      }}
    />
  </div>
);

