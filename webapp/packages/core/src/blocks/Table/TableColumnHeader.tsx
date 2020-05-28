/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { useStyles } from '@dbeaver/core/theming';

type Props = React.PropsWithChildren<{
  title?: string;
  className?: string;
}>

export function TableColumnHeader({ title, children, className }: Props) {
  return styled(useStyles())(
    <th title={title} className={className}>
      {children}
    </th>
  );
}
