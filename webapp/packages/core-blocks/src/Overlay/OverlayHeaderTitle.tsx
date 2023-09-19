/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useS } from '../useS';
import style from './OverlayHeaderTitle.m.css';

interface Props {
  className?: string;
}

export const OverlayHeaderTitle: React.FC<React.PropsWithChildren<Props>> = function OverlayHeaderTitle({ className, children }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { headerTitle: true }, className)}>
      <h3 className={s(styles, { headerTitleContent: true })}>{children}</h3>
    </div>
  );
};
