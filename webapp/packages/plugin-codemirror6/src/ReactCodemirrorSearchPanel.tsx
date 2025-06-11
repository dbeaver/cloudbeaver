/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Compartment, EditorState, StateEffect } from '@codemirror/state';
import {
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  search,
  SearchQuery,
  setSearchQuery,
  RegExpCursor,
} from '@codemirror/search';
import { observer } from 'mobx-react-lite';
import { useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ReactCodemirrorContext } from './ReactCodemirrorContext.js';
import { SearchPanel, type SearchPanelRef } from './SearchPanel/SearchPanel.js';

interface Props extends React.PropsWithChildren {
  className?: string;
  incomingView?: boolean;
  top?: boolean;
}

function getSearchMatchesCount(state: EditorState, config?: SearchQuery) {
  const searchQuery = new SearchQuery(config ?? getSearchQuery(state));

  let cursor;
  const counter = { count: 0, current: 1 };
  const options = { ignoreCase: !config?.caseSensitive };

  if (config?.regexp) {
    try {
      cursor = new RegExpCursor(state.doc, config.search, options);
    } catch (error) {
      return counter;
    }
  } else {
    cursor = searchQuery.getCursor(state);
  }

  const { from, to } = state.selection.main;

  let item = cursor.next();
  while (!item.done) {
    if (item.value.from === from && item.value.to === to) {
      counter.current = counter.count + 1;
    }

    item = cursor.next();
    counter.count++;
  }

  return counter;
}

export const ReactCodemirrorSearchPanel: React.FC<Props> = observer(function ReactCodemirrorSearchPanel({ className, incomingView, top }) {
  const dom = useMemo(() => document.createElement('div'), []);
  const compartment = useMemo(() => new Compartment(), []);
  const context = useContext(ReactCodemirrorContext);
  const view = incomingView ? context?.incomingView : context?.view;
  const searchPanelRef = useRef<SearchPanelRef>(null);
  const [searchMatchesCount, setSearchMatchesCount] = useState({ count: 0, current: 1 });
  const [queryState, setQueryState] = useState<SearchQuery>(() => (view ? getSearchQuery(view?.state) : new SearchQuery({ search: '' })));

  function updateQuery(updates: Partial<SearchQuery>) {
    if (view) {
      view.dispatch({
        effects: setSearchQuery.of(new SearchQuery({ ...queryState, ...updates })),
      });
    }
  }

  function handleQueryChange(value: string) {
    updateQuery({ search: value });
  }

  function handleCaseSensitiveToggle() {
    updateQuery({ caseSensitive: !queryState.caseSensitive });
  }

  function handleRegexToggle() {
    updateQuery({ regexp: !queryState.regexp });
  }

  function handleWholeWordToggle() {
    updateQuery({ wholeWord: !queryState.wholeWord });
  }

  function handleReplaceChange(value: string) {
    updateQuery({ replace: value });
  }

  function handleFindNext() {
    if (view) {
      findNext(view);
    }
  }

  function handleFindPrevious() {
    if (view) {
      findPrevious(view);
    }
  }

  function handleReplaceNext() {
    if (view) {
      replaceNext(view);
    }
  }

  function handleReplaceAll() {
    if (view) {
      replaceAll(view);
    }
  }

  function handleClose() {
    if (view) {
      closeSearchPanel(view);
    }
  }

  useLayoutEffect(() => {
    if (view) {
      view.dispatch({
        effects: [
          StateEffect.appendConfig.of(
            compartment.of(
              search({
                createPanel: () => ({
                  dom,
                  top,
                  update(update) {
                    const searchQuery = getSearchQuery(update.state);
                    setQueryState(searchQuery);
                    setSearchMatchesCount(getSearchMatchesCount(update.state, searchQuery));
                  },
                  mount: () => {
                    searchPanelRef.current?.focus();
                  },
                }),
              }),
            ),
          ),
        ],
      });

      return () => {
        view.dispatch({
          effects: compartment.reconfigure([]),
        });
      };
    }

    return undefined;
  }, [view, top, compartment]);

  useLayoutEffect(() => {
    if (className) {
      const classes = className.split(' ');
      dom.classList.add(...classes);

      return () => {
        dom.classList.remove(...classes);
      };
    }
    return undefined;
  }, [className, dom.classList]);

  if (!view) {
    return null;
  }

  return createPortal(
    <SearchPanel
      isReadOnly={view.state.readOnly}
      ref={searchPanelRef}
      queryState={queryState}
      searchMatchesCount={searchMatchesCount}
      onQueryChange={handleQueryChange}
      onCaseSensitiveToggle={handleCaseSensitiveToggle}
      onRegexToggle={handleRegexToggle}
      onWholeWordToggle={handleWholeWordToggle}
      onReplaceChange={handleReplaceChange}
      onFindNext={handleFindNext}
      onFindPrevious={handleFindPrevious}
      onReplaceAll={handleReplaceAll}
      onReplaceNext={handleReplaceNext}
      onClose={handleClose}
    />,
    dom,
  );
});
