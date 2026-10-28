/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { HTMLAttributes, PropsWithChildren } from 'react';

import { s } from '../s.js';
import { useS } from '../useS.js';
import fieldDescriptionStyles from './FieldDescription.module.css';

interface Props extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  invalid?: boolean;
}
export const FieldDescription: React.FC<PropsWithChildren<Props>> = observer(function FieldDescription({ children, className, invalid, ...rest }) {
  const styles = useS(fieldDescriptionStyles);

  return (
    <div {...rest} className={s(styles, { fieldDescription: true, invalid }, className)}>
      {children}
    </div>
  );
});
