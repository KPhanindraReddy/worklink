import { availabilityOptions } from '../../utils/constants';
import { Button } from '../common/Button';

export const AvailabilityToggle = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {availabilityOptions.map((option) => (
      <Button
        key={option}
        type="button"
        variant={value === option ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onChange(option)}
      >
        {option}
      </Button>
    ))}
  </div>
);

