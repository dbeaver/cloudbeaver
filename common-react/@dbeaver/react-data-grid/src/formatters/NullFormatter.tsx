import styles from './NullFormatter.module.css';
import { clsx } from '@dbeaver/ui-kit';

interface Props {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function NullFormatter({ className, onClick }: Props) {
  return (
    <span className={clsx(styles['nullValue'], className)} onClick={onClick}>
      [NULL]
    </span>
  );
}
