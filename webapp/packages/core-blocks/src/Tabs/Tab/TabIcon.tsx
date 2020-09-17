/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { IconOrImage } from '../../IconOrImage';

type TabIconProps = {
  icon?: string;
  viewBox?: string;
  className?: string;
}

export function TabIcon({ icon, viewBox, className }: TabIconProps) {
  return styled(useStyles())(
    <tab-icon as="div" className={className}>
      {icon ? <IconOrImage icon={icon} viewBox={viewBox} /> : <placeholder as="div" />}
    </tab-icon>
  );
}
