/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import {
  Container,
  type InputAutocompleteProposal,
  InputAutocompletionMenu,
  type PlaceholderComponent,
  useInputAutocomplete,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { InlineEditor } from '@cloudbeaver/core-ui';

import type { ITableHeaderPlaceholderProps } from './TableHeaderService.js';
import styles from './TableWhereFilter.module.css';
import { useTableViewerHeaderData } from './useTableViewerHeaderData.js';
import { useWhereFilter } from './useWhereFilter.js';

const AUTOCOMPLETE_WORD_SEPARATOR = /[^\w]/;

export const TableWhereFilter: PlaceholderComponent<ITableHeaderPlaceholderProps> = observer(function TableWhereFilter({ model, resultIndex }) {
  const translate = useTranslate();
  const state = useWhereFilter(model, resultIndex);
  const data = useTableViewerHeaderData({ model, resultIndex });
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteState = useInputAutocomplete(inputRef, {
    separator: AUTOCOMPLETE_WORD_SEPARATOR,
    sourceHints: data.hintProposals ?? [],
    matchStrategy: 'fuzzy',
  });

  if (!state.supported) {
    return null;
  }

  function handleSelect(proposal: InputAutocompleteProposal) {
    autocompleteState.replaceCurrentWord(proposal.replacementString);
    state.set(autocompleteState.inputValue);
  }

  async function onSave() {
    try {
      await state.apply();
    } finally {
      inputRef.current?.focus();
    }
  }

  return (
    <Container className={styles['imbeddedEditor']}>
      <InlineEditor
        ref={inputRef}
        className={styles['inlineEditor']}
        name="data_where"
        value={state.filter}
        placeholder={translate(state.constraints?.supported ? 'table_header_sql_expression' : 'table_header_sql_expression_not_supported')}
        controlsPosition="inside"
        edited={!!state.filter}
        disableSave={!state.applicableFilter}
        disabled={state.disabled}
        simple
        onSave={onSave}
        onChange={state.set}
      />
      <InputAutocompletionMenu
        position={autocompleteState.position}
        proposals={autocompleteState.proposals}
        menuRef={autocompleteState.menuRef}
        onSelect={handleSelect}
      />
    </Container>
  );
});
