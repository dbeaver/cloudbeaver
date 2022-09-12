/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import {
  ItemListSearch, ItemList, SubmittingForm, TextPlaceholder, useFocus
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { Database } from './Database';

const styles = css`
    SubmittingForm {
      composes: theme-background-surface theme-text-on-surface from global;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
  `;

interface Props {
  databases: AdminConnectionSearchInfo[];
  hosts: string;
  disabled?: boolean;
  className?: string;
  onSelect: (database: AdminConnectionSearchInfo) => void;
  onChange: (hosts: string) => void;
  onSearch?: () => Promise<void>;
}

export const DatabaseList = observer<Props>(function DatabaseList({
  databases, hosts, disabled, className, onSelect, onChange, onSearch,
}) {
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

  const placeholderMessage = isSearched ? 'connections_not_found' : 'connections_administration_search_database_tip';

  return styled(useStyles(styles))(
    <SubmittingForm ref={focusedRef} className={className} onSubmit={onSearch}>
      <ItemListSearch value={hosts} placeholder={translate('connections_administration_search_database_tip')} disabled={disabled} onChange={onChange} onSearch={searchHandler} />
      <ItemList>
        {databases.map(database => (
          <Database key={database.host + database.port} database={database} onSelect={onSelect} />
        ))}
      </ItemList>
      {!databases.length && <TextPlaceholder>{translate(placeholderMessage)}</TextPlaceholder>}
    </SubmittingForm>
  );
});
