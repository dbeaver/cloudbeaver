/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const styles = css`
  box-element {
    min-width: 450px;
  }
`;

interface Props {
  className?: string;
}

export const FormBoxElement: React.FC<Props> = function FormBoxElement({ children, className }) {
  return styled(styles)(
    <box-element as='div' className={className}>
      {children}
    </box-element>
  );
};
