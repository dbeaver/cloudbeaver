/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useRef, useState } from 'react';

import { SearchPanel, type SearchPanelQuery, type SearchPanelRef } from '@dbeaver/ui-kit';
import icons from '@dbeaver/ui-kit/assets/icons/preload/icons.svg?raw';

const meta = {
  title: 'Components/SearchPanel',
  component: SearchPanel,
};

export default meta;

function useMockSearch(initial: SearchPanelQuery) {
  const [query, setQuery] = useState<SearchPanelQuery>(initial);
  const [matches, setMatches] = useState({ count: 5, current: 1 });

  function updateQuery(next: Partial<SearchPanelQuery>) {
    const value = { ...query, ...next };
    setQuery(value);
    if (!value.search) {
      setMatches({ count: 0, current: 0 });
    } else {
      setMatches(prev => ({ ...prev, count: Math.max(prev.count, 1), current: 1 }));
    }
  }

  return { query, matches, updateQuery, setMatches };
}

export const SearchOnly = () => {
  const { query, matches, updateQuery, setMatches } = useMockSearch({ search: '', caseSensitive: false, wholeWord: false, regexp: false });
  const ref = useRef<SearchPanelRef>(null);

  return (
    <div className="tw:relative">
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: icons }} />
      <SearchPanel
        ref={ref}
        query={query}
        searchMatchesCount={matches}
        isReadOnly
        onQueryChange={value => updateQuery({ search: value })}
        onCaseSensitiveToggle={() => updateQuery({ caseSensitive: !query.caseSensitive })}
        onWholeWordToggle={() => updateQuery({ wholeWord: !query.wholeWord })}
        onRegexToggle={() => updateQuery({ regexp: !query.regexp })}
        onFindNext={() => setMatches(prev => ({ ...prev, current: prev.count ? Math.min(prev.current + 1, prev.count) : 0 }))}
        onFindPrevious={() => setMatches(prev => ({ ...prev, current: prev.count ? Math.max(prev.current - 1, 1) : 0 }))}
        onClose={() => updateQuery({ search: '' })}
      />
    </div>
  );
};

export const SearchWithReplace = () => {
  const { query, matches, updateQuery, setMatches } = useMockSearch({
    search: 'value',
    replace: 'new',
    caseSensitive: false,
    wholeWord: false,
    regexp: false,
  });
  const ref = useRef<SearchPanelRef>(null);

  return (
    <div className="tw:bg-gray-700/10 tw:rounded">
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: icons }} />
      <SearchPanel
        ref={ref}
        query={query}
        searchMatchesCount={matches}
        onQueryChange={value => updateQuery({ search: value })}
        onReplaceChange={value => updateQuery({ replace: value })}
        onCaseSensitiveToggle={() => updateQuery({ caseSensitive: !query.caseSensitive })}
        onWholeWordToggle={() => updateQuery({ wholeWord: !query.wholeWord })}
        onRegexToggle={() => updateQuery({ regexp: !query.regexp })}
        onFindNext={() => setMatches(prev => ({ ...prev, current: prev.count ? Math.min(prev.current + 1, prev.count) : 0 }))}
        onFindPrevious={() => setMatches(prev => ({ ...prev, current: prev.count ? Math.max(prev.current - 1, 1) : 0 }))}
        onReplaceNext={() => updateQuery({ search: query.search })}
        onReplaceAll={() => updateQuery({ search: query.search })}
        onClose={() => updateQuery({ search: '' })}
      />
    </div>
  );
};
