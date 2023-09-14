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
import style from './Overlay.m.css';

interface Props {
  active?: boolean;
  fill?: boolean;
  className?: string;
}

export const Overlay = observer<React.PropsWithChildren<Props>>(function Overlay({ active, fill, className, children }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { overlay: true, active, fill }, className)}>
      <div className={s(styles, { box: true })}>{children}</div>
    </div>
  );
});
