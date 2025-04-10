import { NullFormatter } from './NullFormatter.js';
import { Checkbox, clsx, Focusable } from '@dbeaver/ui-kit';

interface Props {
  value: boolean | null;
  className?: string;
  onClick?: () => void;
}

export function BooleanFormatter({ value, className, onClick }: Props) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      onClick?.();
    }
  };
  return (
    <Focusable
      className={clsx('tw:flex tw:items-center tw:w-full tw:outline-none tw:hover:cursor-pointer', className)}
      onKeyDown={handleKeyDown}
      onClick={onClick}
    >
      {value === null ? <NullFormatter /> : <Checkbox className="tw:data-disabled:opacity-100" disabled size="small" checked={value} />}
    </Focusable>
  );
}
