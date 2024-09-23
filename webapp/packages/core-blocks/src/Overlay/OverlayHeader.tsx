/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './OverlayHeader.module.css';

interface Props {
  className?: string;
}

export const OverlayHeader: React.FC<React.PropsWithChildren<Props>> = function OverlayHeader({ className, children }) {
  const styles = useS(style);

  return <div className={s(styles, { header: true }, className)}>{children}</div>;
};
