/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useS } from '../useS';
import style from './ConnectionMark.m.css';

interface Props {
  connected: boolean;
  className?: string;
}

export const ConnectionMark: React.FC<Props> = function ConnectionMark({ connected, className }) {
  const styles = useS(style);

  return <div className={s(styles, { status: true, connected }, className)} />;
};
