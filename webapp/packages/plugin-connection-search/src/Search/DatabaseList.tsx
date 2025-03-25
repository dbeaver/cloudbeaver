/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import { Form, ItemList, ItemListSearch, s, TextPlaceholder, useFocus, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';

import { Database } from './Database.js';
import style from './DatabaseList.module.css';

interface Props {
  databases: AdminConnectionSearchInfo[];
  hosts: string;
  disabled?: boolean;
  className?: string;
  onSelect: (database: AdminConnectionSearchInfo) => void;
  onChange: (hosts: string) => void;
  onSearch?: () => Promise<void>;
}

export const DatabaseList = observer<Props>(function DatabaseList({ databases, hosts, disabled, className, onSelect, onChange, onSearch }) {
  const styles = useS(style);
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const translate = useTranslate();
  const [isSearched, setIsSearched] = useState(false);

  const searchHandler = useCallback(() => {
    if (onSearch) {
      onSearch().then(() => {
        setIsSearched(true);
      });
    }
  }, [onSearch]);

  const placeholderMessage = isSearched ? 'connections_not_found' : 'core_connections_search_database_tip';

  return (
    <Form ref={focusedRef} className={s(styles, { form: true }, className)} onSubmit={onSearch}>
      <ItemListSearch
        value={hosts}
        placeholder={translate('core_connections_search_database_tip')}
        disabled={disabled}
        permanentSearchIcon
        onChange={onChange}
        onSearch={searchHandler}
      />
      <ItemList>
        {databases.map(database => (
          <Database key={database.host + database.port} database={database} onSelect={onSelect} />
        ))}
      </ItemList>
      {!databases.length && <TextPlaceholder>{translate(placeholderMessage)}</TextPlaceholder>}
    </Form>
  );
});
