/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DetailedHTMLProps, IframeHTMLAttributes } from 'react';

import style from './iframe.m.css';
import { s } from './s';
import { useS } from './useS';

export const Iframe: React.FC<DetailedHTMLProps<IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>> = function Iframe(props) {
  const styles = useS(style);

  return <iframe className={s(styles, { iframe: true })} {...props} />;
};
