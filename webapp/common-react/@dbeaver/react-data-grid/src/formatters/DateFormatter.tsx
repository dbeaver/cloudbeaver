import { NullFormatter } from './NullFormatter.js';

interface Props {
  value: Date | null;
  type?: 'time' | 'date' | 'datetime';
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function DateFormatter({ value, type = 'datetime', onClick }: Props) {
  if (value === null) {
    return <NullFormatter />;
  }
  return (
    <div onClick={onClick}>
      {value.toLocaleString(undefined, {
        dateStyle: type === 'date' ? 'long' : undefined,
        timeStyle: type === 'time' ? 'long' : undefined,
      })}
    </div>
  );
}
