/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

type Props = React.PropsWithChildren<{
  title?: string;
  min?: boolean;
  className?: string;
}>

export function TableColumnHeader({
  title, children, min, className,
}: Props) {
  return styled(useStyles())(
    <th title={title} className={className} {...use({ min })}>
      {children}
    </th>
  );
}
