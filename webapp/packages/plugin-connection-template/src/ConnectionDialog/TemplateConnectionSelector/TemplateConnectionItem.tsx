/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  ListItem, ListItemDescription, ListItemName, ListItemIcon, StaticImage
} from '@cloudbeaver/core-blocks';
import { DBDriver, Connection } from '@cloudbeaver/core-connections';

type Props = {
  template: Connection;
  dbDriver?: DBDriver;
  onSelect(connectionId: string): void;
}

const styles = css`
  StaticImage {
    box-sizing: border-box;
    width: 24px;
    max-height: 24px;
  }
`;

export const TemplateConnectionItem = observer(function TemplateConnectionItem({
  template,
  dbDriver,
  onSelect,
}: Props) {
  const select = useCallback(() => onSelect(template.id), [template]);

  return styled(styles)(
    <ListItem onClick={select}>
      <ListItemIcon><StaticImage icon={dbDriver?.icon}/></ListItemIcon>
      <ListItemName>{template.name}</ListItemName>
      <ListItemDescription title={template.description}>{template.description}</ListItemDescription>
    </ListItem>
  );
});
