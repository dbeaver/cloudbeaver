/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { useStyles } from '@dbeaver/core/theming';

type TabTitleProps = {
  title?: string;
  className?: string;
}

export function TabTitle({ title, className }: TabTitleProps) {
  return styled(useStyles())(
    <tab-title as="div" className={className}>
      {title || <placeholder as="div" />}
    </tab-title>
  );
}
