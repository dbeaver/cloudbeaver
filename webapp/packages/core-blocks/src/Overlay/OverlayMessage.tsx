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
import style from './OverlayMessage.m.css';

interface Props {
  className?: string;
}

export const OverlayMessage = observer<React.PropsWithChildren<Props>>(function OverlayMessage({ className, children }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { message: true }, className)}>
      <div className={s(styles, { messageBox: true })}>{children}</div>
    </div>
  );
});
