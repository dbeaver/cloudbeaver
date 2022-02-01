/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

const style = css`
  actions {
    padding-top: 42px;
    gap: 16px;
    display: flex;
  }
`;

interface Props {
  className?: string;
}

export const OverlayActions = observer<Props>(function OverlayActions({
  className,
  children,
}){
  return styled(style)(
    <actions className={className}>
      {children}
    </actions>
  );
});