import { observer } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';

import { s } from '../s';
import { useS } from '../useS';
import fieldDescriptionStyles from './FieldDescription.m.css';

interface Props {
  className?: string;
  invalid?: boolean;
}
export const FieldDescription: React.FC<PropsWithChildren<Props>> = observer(function FieldDescription({ children, className, invalid }) {
  const styles = useS(fieldDescriptionStyles);

  return <div className={s(styles, { fieldDescription: true, invalid }, className)}>{children}</div>;
});
