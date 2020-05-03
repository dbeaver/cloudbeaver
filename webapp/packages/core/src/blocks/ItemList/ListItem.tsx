/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import styled from 'reshadow';

import { StaticImage } from '@dbeaver/core/blocks';
import { useStyles } from '@dbeaver/core/theming';

import { Styles } from './styles';

type ListItemProps = {
  name?: string;
  icon?: string;
  description?: string;
  onClick(): void;
  className?: string;
}

export function ListItem({
  name,
  icon,
  description,
  onClick,
  className,
}: ListItemProps) {
  const styles = useContext(Styles);

  return styled(useStyles(...styles))(
    <list-item as="div" onClick={onClick} className={className}>
      <list-item-icon as="div"><StaticImage icon={icon}/></list-item-icon>
      <list-item-name as="div">{name}</list-item-name>
      <list-item-description as="div" title={description}>{description}</list-item-description>
    </list-item>
  );
}
