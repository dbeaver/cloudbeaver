import { NullFormatter } from './NullFormatter.js';
import { Checkbox } from '@dbeaver/ui-kit';

interface Props {
  value: boolean | null;
  onClick?: () => void;
}

export function BooleanFormatter({ value, onClick }: Props) {
  if (value === null) {
    return <NullFormatter />;
  }
  return <Checkbox size="small" checked={value} onClick={onClick} />;
}
