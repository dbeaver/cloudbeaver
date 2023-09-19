/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type React from 'react';

import { Icon } from './Icon';
import { s } from './s';
import style from './TimerIcon.m.css';
import { useS } from './useS';

interface Props {
  state: 'play' | 'stop';
  interval: number;
}

export const TimerIcon: React.FC<Props & React.ButtonHTMLAttributes<HTMLDivElement>> = function TimerIcon({ state, interval, ...rest }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { timer: true })} {...rest}>
      <Icon className={s(styles, { icon: true })} name="/icons/timer_m.svg#root" viewBox="0 0 24 24" />
      <div className={s(styles, { state: true })}>
        <Icon className={s(styles, { icon: true })} name={`/icons/timer-${state}_m.svg#root`} viewBox="0 0 12 12" />
      </div>
      <div className={s(styles, { interval: true })}>{interval}</div>
    </div>
  );
};
