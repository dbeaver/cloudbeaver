/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';


export const style = composes(
  css`
    overlay {
      composes: theme-text-on-primary from global;
    }
    box {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.4);

      [|active=false] {
        display: none;
      }
    }
    
    overlay {
      margin: auto;
    }

    overlay, box {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    box {
      composes: theme-elevation-z6 from global;
      border-radius: 0.25rem;
      padding: 24px 16px;
    }
  `
);

interface Props {
  active?: boolean;
  className?: string;
}

export const Overlay = observer<Props>(function Overlay({
  active,
  className,
  children,
}) {
  const styles = useStyles(style);

  if (!active) {
    return null;
  }

  return styled(styles)(
    <overlay className={className} {...use({ active })}>
      <box>
        {children}
      </box>
    </overlay>
  );
});