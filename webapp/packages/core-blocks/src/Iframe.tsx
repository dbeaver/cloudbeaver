/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { DetailedHTMLProps, IframeHTMLAttributes } from 'react';

import style from './Iframe.module.css';
import { s } from './s.js';
import { useS } from './useS.js';

export const Iframe = observer<DetailedHTMLProps<IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>>(function Iframe(props) {
  const styles = useS(style);

  return <iframe className={s(styles, { iframe: true })} {...props} />;
});
