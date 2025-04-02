import styles from './NullFormatter.module.css';
import { clsx } from '@dbeaver/ui-kit';

export function NullFormatter() {
  return <span className={clsx(styles['nullValue'])}>[NULL]</span>;
}
