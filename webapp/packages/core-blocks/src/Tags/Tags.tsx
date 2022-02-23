/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

interface Props {
  className?: string;
}

const style = css`
  tags {
    padding: 0;
    margin: 0;
    list-style: none;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

export const Tags = observer<Props>(function Tags({ children, className }) {
  return styled(style)(
    <tags as='ul' className={className}>
      {children}
    </tags>
  );
});