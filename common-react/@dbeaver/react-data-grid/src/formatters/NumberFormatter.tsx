import { NullFormatter } from './NullFormatter.js';

interface Props {
  value: number | null;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function NumberFormatter({ value, className, onClick }: Props) {
  if (value === null) {
    return <NullFormatter className={className} onClick={onClick} />;
  }
  return (
    <div style={{ textAlign: 'right' }} className={className} onClick={onClick}>
      {value.toLocaleString()}
    </div>
  );
}
