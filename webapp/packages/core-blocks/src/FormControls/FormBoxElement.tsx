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
import style from './FormBoxElement.m.css';

interface Props {
  className?: string;
  max?: boolean;
  children?: React.ReactNode;
}

export const FormBoxElement = observer<Props>(function FormBoxElement({ children, className, max }) {
  const styles = useS(style);

  return <div className={s(styles, { boxElement: true, max })}>{children}</div>;
});
