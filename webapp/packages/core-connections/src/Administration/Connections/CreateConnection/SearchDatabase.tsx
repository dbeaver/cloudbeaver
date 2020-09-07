/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';

import { DatabaseList } from './DatabaseList';

type Props = {
  databases: AdminConnectionSearchInfo[];
  hosts: string;
  disabled?: boolean;
  onSelect(database: AdminConnectionSearchInfo): void;
  onChange(hosts: string): void;
  onSearch?(): void;
  className?: string;
}

export const SearchDatabase = observer(function SearchDatabase({
  databases,
  hosts,
  disabled,
  onChange,
  onSelect,
  onSearch,
  className,
}: Props) {

  return (
    <DatabaseList
      databases={databases}
      hosts={hosts}
      disabled={disabled}
      onSelect={onSelect}
      onChange={onChange}
      onSearch={onSearch}
      className={className}
    />
  );
});
