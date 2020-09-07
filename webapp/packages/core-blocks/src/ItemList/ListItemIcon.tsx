/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { Styles } from './styles';

type Props = React.PropsWithChildren<{
  className?: string;
}>

export function ListItemIcon({
  children,
  className,
}: Props) {
  const styles = useContext(Styles);

  return styled(useStyles(...styles))(
    <list-item-icon as="div" className={className}>{children}</list-item-icon>
  );
}
