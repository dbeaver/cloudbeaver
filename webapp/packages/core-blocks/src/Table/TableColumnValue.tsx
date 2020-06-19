/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

type Props = React.PropsWithChildren<{
  className?: string;
  centerContent?: boolean;
}>

export const TableColumnValue = observer(function TableColumnValue({ children, centerContent, className }: Props) {
  return styled(useStyles())(
    <td className={className} {...use({ centerContent })}>{children}</td>
  );
});
