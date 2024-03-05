import { observer } from 'mobx-react-lite';
import type { LabelHTMLAttributes, PropsWithChildren } from 'react';

import { s } from '../s';
import { useS } from '../useS';
import fieldLabelStyles from './FieldLabel.m.css';

type Props = LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
  title?: string;
  required?: boolean;
};
export const FieldLabel: React.FC<PropsWithChildren<Props>> = observer(function FieldLabel({ children, className, required, ...rest }) {
  const styles = useS(fieldLabelStyles);

  return (
    <label {...rest} className={s(styles, { fieldLabel: true }, className)}>
      {children}
      {required && ' *'}
    </label>
  );
});
