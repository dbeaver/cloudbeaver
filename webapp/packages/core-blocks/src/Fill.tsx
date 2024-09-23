/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import style from './Fill.module.css';
import { s } from './s.js';
import { useS } from './useS.js';

interface Props {
  className?: string;
}

export const Fill: React.FC<Props> = function Fill({ className }) {
  const styles = useS(style);
  return <div className={s(styles, { fill: true }, className)} />;
};
