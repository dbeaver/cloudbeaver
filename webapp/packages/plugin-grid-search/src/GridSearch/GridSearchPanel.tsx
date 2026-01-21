/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { SearchPanel, type SearchPanelRef } from '@dbeaver/ui-kit';

import type { IGridSearchState } from './IGridSearchAdapter.js';

export interface GridSearchPanelProps {
  /** The grid search state from useGridSearch hook */
  state: IGridSearchState;
  /** Whether the grid is read-only (disables replace functionality) */
  isReadOnly?: boolean;
  className?: string;
}

export const GridSearchPanel = observer(
  forwardRef<SearchPanelRef, GridSearchPanelProps>(function GridSearchPanel({ state, isReadOnly, className }, ref) {
    if (!state.open) {
      return null;
    }

    return (
      <SearchPanel
        ref={ref}
        className={className}
        isReadOnly={isReadOnly}
        query={state.query}
        defaultShowReplace={state.replaceOpen}
        searchMatchesCount={state.matches}
        onQueryChange={state.setQuery}
        onCaseSensitiveToggle={state.toggleCaseSensitive}
        onWholeWordToggle={state.toggleWholeWord}
        onRegexToggle={state.toggleRegex}
        onFindNext={state.findNext}
        onFindPrevious={state.findPrevious}
        onReplaceChange={state.setReplace}
        onReplaceToggle={state.setReplaceOpen}
        onReplaceAll={state.replaceAll}
        onReplaceNext={state.replaceActive}
        onClose={state.close}
      />
    );
  }),
);
