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
  message {
    padding: 16px;
  }
`;

interface Props {
  className?: string;
}

export const OverlayMessage = observer<Props>(function OverlayMessage({
  className,
  children,
}){
  return styled(style)(
    <message className={className}>
      {children}
    </message>
  );
});