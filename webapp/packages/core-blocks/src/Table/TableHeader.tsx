/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

type Props = React.PropsWithChildren<{
  className?: string;
}>

export function TableHeader({ children, className }: Props) {
  return styled(useStyles())(
    <thead className={className}>
      <tr>
        {children}
      </tr>
    </thead>
  );
}
