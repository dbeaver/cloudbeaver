/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const styles = css`
  box {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
  }
`;

interface Props {
  className?: string;
}

export const FormBox: React.FC<Props> = function FormBox({ children, className }) {
  return styled(styles)(
    <box as='div' className={className}>
      {children}
    </box>
  );
};
