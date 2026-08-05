/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../s.js';
import { useS } from '../useS.js';
import styles from './GridAction.module.css';

type Props = React.PropsWithChildren & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export const GridAction = observer(function GridAction({ children, className, ...rest }: Props) {
  const style = useS(styles);
  return (
    <button className={s(style, { gridAction: true }, className)} {...rest}>
      {children}
    </button>
  );
});
