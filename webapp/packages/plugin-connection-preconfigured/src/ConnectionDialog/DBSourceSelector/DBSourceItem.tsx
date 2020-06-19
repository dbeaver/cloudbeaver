/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';

import { DBDriver, DBSource } from '@cloudbeaver/core-app';
import { ListItem } from '@cloudbeaver/core-blocks';

type DBSourceItemProps = {
  dbSource: DBSource;
  dbDriver?: DBDriver;
  onSelect(driverId: string): void;
}

export const DBSourceItem = observer(function DBSourceItem({ dbSource, dbDriver, onSelect }: DBSourceItemProps) {
  const select = useCallback(() => onSelect(dbSource.id), [dbSource]);

  return <ListItem icon={dbDriver?.icon} name={dbSource.name} description={dbSource.description} onClick={select}/>;
});
