/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

interface Props {
  title?: string;
  min?: boolean;
  flex?: boolean;
  centerContent?: boolean;
  className?: string;
}

export const TableColumnHeader: React.FC<Props> = function TableColumnHeader({
  title, min, flex, centerContent, className, children,
}) {
  return styled(useStyles())(
    <th
      title={title}
      className={className}
      {...use({ min, centerContent })}
    >
      {flex ? <th-flex className={className}>{children}</th-flex> : children}
    </th>
  );
};
