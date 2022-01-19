/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { Styles } from './styles';

interface IProps {
  onClick: () => void;
  className?: string;
}

export const ListItem: React.FC<IProps> = function ListItem({
  children,
  onClick,
  className,
}) {
  const styles = useContext(Styles);

  return styled(useStyles(styles))(
    <list-item as="div" className={className} onClick={onClick}>
      {children}
    </list-item>
  );
};
