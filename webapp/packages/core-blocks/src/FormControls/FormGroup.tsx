/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const styles = css`
  group {
    box-sizing: border-box;
    display: flex;
  }
`;

interface Props {
  className?: string;
}

export const FormGroup: React.FC<Props> = function FormGroup({ children, className }) {
  return styled(styles)(
    <group as='div' className={className}>
      {children}
    </group>
  );
};
