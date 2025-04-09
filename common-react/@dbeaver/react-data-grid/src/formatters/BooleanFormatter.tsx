import { NullFormatter } from './NullFormatter.js';
import { Checkbox } from '@dbeaver/ui-kit';

interface Props {
  value: boolean | null;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function BooleanFormatter({ value, className, onClick }: Props) {
  if (value === null) {
    return <NullFormatter className={className} onClick={onClick} />;
  }
  return <Checkbox size="small" checked={value} className={className} onClick={onClick} />;
}
