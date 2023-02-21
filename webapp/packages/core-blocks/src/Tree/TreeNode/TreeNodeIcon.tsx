/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { StaticImage } from '../../StaticImage';
import { useStyles } from '../../useStyles';

const styles = css`
  StaticImage {
    height: 100%;
  }
`;

interface Props {
  icon?: string;
  style?: ComponentStyle;
  className?: string;
}

export const TreeNodeIcon: React.FC<React.PropsWithChildren<Props>> = function TreeNodeIcon({
  icon,
  style,
  className,
  children,
}) {
  return styled(useStyles(styles, style))(
    <icon className={className}>
      {icon && <StaticImage icon={icon} />}
      {children}
    </icon>
  );
};
