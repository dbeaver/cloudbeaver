/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type SearchPanelRef, SearchPanel } from '@dbeaver/ui-kit';
import { observer } from 'mobx-react-lite';
import type { useDataGridSearchState } from './DataGridSearchProvider.js';

export const SearchPanelObserver = observer(function SearchPanelObserver({
  state,
  panelRef,
  isReadOnly,
}: {
  state: ReturnType<typeof useDataGridSearchState>;
  panelRef: React.RefObject<SearchPanelRef | null>;
  isReadOnly?: boolean;
}) {
  return state.open ? (
    <SearchPanel
      ref={panelRef}
      className="tw:bg-(--theme-secondary) tw:px-0! tw:py-1! tw:mb-0!"
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
      onReplaceNext={state.replaceActive}
      onClose={state.close}
    />
  ) : null;
});
