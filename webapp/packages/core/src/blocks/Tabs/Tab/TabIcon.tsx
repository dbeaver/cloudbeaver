/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { useStyles } from '@dbeaver/core/theming';

import { StaticImage } from '../../StaticImage';

type TabIconProps = {
  icon?: string;
  className?: string;
}

export const TabIcon = observer(function TabIcon({
  icon,
  className,
}: TabIconProps) {
  return styled(useStyles())(
    <tab-icon as="div" className={className}>
      {icon ? <StaticImage icon={icon} /> : <placeholder as="div" />}
    </tab-icon>
  );
});
