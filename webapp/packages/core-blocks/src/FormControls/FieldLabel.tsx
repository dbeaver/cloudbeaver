/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { LabelHTMLAttributes, PropsWithChildren } from 'react';

import { s } from '../s.js';
import { useS } from '../useS.js';
import fieldLabelStyles from './FieldLabel.module.css';

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
