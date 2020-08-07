/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const styles = css`
  administration-tools {
    height: 48px;
  }
`;

type Props = React.PropsWithChildren<{
  className?: string;
}>

export function AdministrationTools({ children, className }: Props) {

  return styled(styles)(
    <administration-tools as='div' className={className}>
      {children}
    </administration-tools>
  );
}
