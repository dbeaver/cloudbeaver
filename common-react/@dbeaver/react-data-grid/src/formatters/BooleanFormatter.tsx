import { NullFormatter } from './NullFormatter.js';
import { Checkbox, clsx, Focusable } from '@dbeaver/ui-kit';

interface Props {
  value: boolean | null;
  className?: string;
  focusable?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
}

export function BooleanFormatter({ value, className, onClick, onKeyDown, focusable }: Props) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      onKeyDown?.(event);
    }
  };
  return (
    <Focusable
      focusable={focusable}
      className={clsx('tw:flex tw:items-center tw:outline-none tw:hover:cursor-pointer', className)}
      onKeyDown={handleKeyDown}
      onClick={onClick}
    >
      {value === null ? <NullFormatter /> : <Checkbox className="tw:data-disabled:opacity-100!" disabled size="small" checked={value} />}
    </Focusable>
  );
}
