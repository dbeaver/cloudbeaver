/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';

import { s } from '../s.js';
import { useS } from '../useS.js';
import fieldDescriptionStyles from './FieldDescription.module.css';

interface Props {
  className?: string;
  invalid?: boolean;
}
export const FieldDescription: React.FC<PropsWithChildren<Props>> = observer(function FieldDescription({ children, className, invalid }) {
  const styles = useS(fieldDescriptionStyles);

  return <div className={s(styles, { fieldDescription: true, invalid }, className)}>{children}</div>;
});
