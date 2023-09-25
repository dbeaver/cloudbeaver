/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../s';
import { useS } from '../useS';
import style from './FormGroup.m.css';

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export const FormGroup = observer<Props>(function FormGroup({ children, className }) {
  const styles = useS(style);

  return <div className={s(styles, { group: true }, className)}>{children}</div>;
});
