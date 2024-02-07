/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { ListItem, ListItemDescription, ListItemIcon, ListItemName, s, StaticImage, useS } from '@cloudbeaver/core-blocks';
import type { Connection, DBDriver } from '@cloudbeaver/core-connections';

import style from './TemplateConnectionItem.m.css';

interface Props {
  template: Connection;
  dbDriver?: DBDriver;
  onSelect: (connectionId: string) => void;
}

export const TemplateConnectionItem = observer<Props>(function TemplateConnectionItem({ template, dbDriver, onSelect }) {
  const styles = useS(style);
  const select = useCallback(() => onSelect(template.id), [template]);

  return (
    <ListItem onClick={select}>
      <ListItemIcon>
        <StaticImage className={s(styles, { staticImage: true })} icon={dbDriver?.icon} />
      </ListItemIcon>
      <ListItemName>{template.name}</ListItemName>
      <ListItemDescription title={template.description}>{template.description}</ListItemDescription>
    </ListItem>
  );
});
