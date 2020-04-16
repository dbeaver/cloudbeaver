/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { DBDriver, DBSource } from '@dbeaver/core/app';
import { StaticImage } from '@dbeaver/core/blocks';
import { useStyles, composes } from '@dbeaver/core/theming';

const styles = composes(
  css`
  db-source-name {
    composes: theme-border-color-secondary from global;
  }
  `,
  css`
  StaticImage {
    box-sizing: border-box;
    width: 24px;
  }
  db-source {
    position: relative;
    cursor: pointer;
    display: flex;
    box-sizing: border-box;
    align-items: center;
    padding: 8px 12px;
  }
  db-source-icon {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 12px;
  }
  db-source-name {
    composes: theme-typography--body1 from global;
    box-sizing: border-box;
    font-weight: 500;
    min-width: 250px;
    padding: 0 24px 0 12px;
    border-right: 1px solid;
    
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  db-source-description {
    composes: theme-typography--body2 from global;
    box-sizing: border-box;
    max-width: 460px;
    padding: 0 12px 0 24px;
    
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
);

type DBSourceItemProps = {
  dbSource: DBSource;
  dbDriver?: DBDriver;
  onSelect(driverId: string): void;
}

export const DBSourceItem = observer(function DBSourceItem({ dbSource, dbDriver, onSelect }: DBSourceItemProps) {

  return styled(useStyles(styles))(
    <db-source as="div" onClick={() => onSelect(dbSource.id)}>
      <db-source-icon as="div"><StaticImage icon={dbDriver?.icon}/></db-source-icon>
      <db-source-name as="div">{dbSource.name}</db-source-name>
      <db-source-description as="div" title={dbSource.description}>{dbSource.description}</db-source-description>
    </db-source>
  );
});
