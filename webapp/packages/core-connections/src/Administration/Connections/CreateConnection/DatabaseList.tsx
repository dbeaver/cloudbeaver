/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { ItemListSearch, ItemList, SubmittingForm } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';

import { Database } from './Database';

const styles = css`
  SubmittingForm {
    display: flex;
    flex-direction: column;
  }
  center {
    margin: auto;
  }
`;

type Props = {
  databases: AdminConnectionSearchInfo[];
  hosts: string;
  disabled?: boolean;
  className?: string;
  onSelect(database: AdminConnectionSearchInfo): void;
  onChange(hosts: string): void;
  onSearch?(): void;
}

export const DatabaseList = observer(function DatabaseList({
  databases, hosts, disabled, className, onSelect, onChange, onSearch,
}: Props) {
  const translate = useTranslate();

  return styled(styles)(
    <SubmittingForm onSubmit={onSearch} className={className}>
      <ItemList>
        <ItemListSearch value={hosts} placeholder={translate('connections_administration_search_database_tip')} onChange={onChange} onSearch={onSearch} disabled={disabled}/>
        {databases.map(database => (
          <Database key={database.host + database.port} database={database} onSelect={onSelect}/>
        ))}
      </ItemList>
      {!databases.length && <center as='div'>{translate('connections_administration_search_database_tip')}</center>}
    </SubmittingForm>
  );
});
