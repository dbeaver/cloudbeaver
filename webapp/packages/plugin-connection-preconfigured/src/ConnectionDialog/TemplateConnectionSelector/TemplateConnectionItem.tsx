/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';

import { DBDriver, Connection } from '@cloudbeaver/core-app';
import { ListItem } from '@cloudbeaver/core-blocks';

type Props = {
  template: Connection;
  dbDriver?: DBDriver;
  onSelect(connectionId: string): void;
}

export const TemplateConnectionItem = observer(function TemplateConnectionItem({
  template,
  dbDriver,
  onSelect,
}: Props) {
  const select = useCallback(() => onSelect(template.id), [template]);

  return <ListItem icon={dbDriver?.icon} name={template.name} description={template.description} onClick={select}/>;
});
