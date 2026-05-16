import { availabilityOptions } from '../../utils/constants';
import { Button } from '../common/Button';

export const AvailabilityToggle = ({ value, onChange }) => (
  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
    {availabilityOptions.map((option) => (
      <Button
        key={option}
        type="button"
        variant={value === option ? 'primary' : 'outline'}
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => onChange(option)}
      >
        {option}
      </Button>
    ))}
  </div>
);
