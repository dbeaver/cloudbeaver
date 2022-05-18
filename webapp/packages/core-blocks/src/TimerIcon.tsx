/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type React from 'react';
import styled, { css } from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { Icon } from './Icon';

const style = css`
  timer {
    position: relative;
    width: 28px;
    height: 24px;

    & > Icon {
      width: 24px;
      height: 24px;
    }
  }
  state, interval {
    composes: theme-background-secondary from global;
    border-radius: 50%;
    width: 12px;
    height: 12px;
  }
  state {
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;

    & > Icon {
      width: 12px;
      height: 12px;
    }
  }
  interval {
    position: absolute;
    right: 0;
    top: 0;

    display: flex;
    font-size: 8px;
    font-weight: bold;
    line-height: normal;
    justify-content: center;
    align-items: center;
  }
`;

interface Props {
  state: 'play' | 'stop';
  interval: number;
  styles?: ComponentStyle;
}

export const TimerIcon: React.FC<Props & React.ButtonHTMLAttributes<HTMLDivElement>> = function TimerIcon({
  state,
  interval,
  styles,
  ...rest
}) {
  return styled(style, useStyles(styles))(
    <timer {...rest}>
      <Icon name='/icons/timer_m.svg#root' viewBox="0 0 24 24" />
      <state><Icon name={`/icons/timer-${state}_m.svg#root`}  viewBox="0 0 12 12" /></state>
      <interval>{interval}</interval>
    </timer>
  );
};