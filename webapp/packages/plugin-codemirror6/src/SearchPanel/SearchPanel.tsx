/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { closeSearchPanel, findNext, findPrevious, getSearchQuery, replaceAll, replaceNext, SearchQuery, setSearchQuery } from '@codemirror/search';

import type { Panel } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Icon } from '@cloudbeaver/core-blocks';
import { IconButton, Input } from '@dbeaver/ui-kit';
import type { EditorState } from '@codemirror/state';
import { observer } from 'mobx-react-lite';

import './SearchPanel.css';

type SearchQueryState = Pick<SearchQuery, 'search' | 'caseSensitive' | 'literal' | 'wholeWord' | 'replace'>;

function getSearchMatchesCount(state: EditorState, config?: SearchQuery) {
  const searchQuery = new SearchQuery(config ?? getSearchQuery(state));

  const cursor = searchQuery.getCursor(state);
  const counter = { count: 0, current: 1 };

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

export const SearchPanel = observer(function SearchPanel({
  view,
  searchMatchesCount,
}: {
  view: EditorView;
  searchMatchesCount?: { count: number; current: number };
}) {
  const [queryState, setState] = useState<SearchQueryState>(getSearchQuery(view.state));
  const [showReplace, setShowReplace] = useState(false);

  function updateQuery(updates: Partial<SearchQuery>) {
    setState(prev => {
      const newState = { ...prev, ...updates };

      const searchQuery = new SearchQuery(newState);

      view.dispatch({
        effects: setSearchQuery.of(searchQuery),
      });

      return newState;
    });
  }

  function handleQueryChange(value: string) {
    updateQuery({ search: value });
  }

  function handleCaseSensitiveToggle() {
    updateQuery({ caseSensitive: !queryState.caseSensitive });
  }

  function handleLiteralToggle() {
    updateQuery({ literal: !queryState.literal });
  }

  function handleWholeWordToggle() {
    updateQuery({ wholeWord: !queryState.wholeWord });
  }

  function handleReplaceChange(value: string) {
    updateQuery({ replace: value });
  }

  function handleFindNext() {
    findNext(view);
  }

  function handleFindPrevious() {
    findPrevious(view);
  }

  function handleReplaceNext() {
    replaceNext(view);
  }

  function handleReplaceAll() {
    replaceAll(view);
  }

  function handleClose() {
    closeSearchPanel(view);
  }

  function handleToggleReplace() {
    setShowReplace(prev => !prev);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        handleFindPrevious();
      } else {
        handleFindNext();
      }
    }
  }

  function handleReplaceKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        handleReplaceAll();
      } else {
        handleReplaceNext();
      }
    }
  }

  return (
    <div className="search-panel tw:space-y-0.5 tw:p-0.5" onKeyDown={handleKeyDown}>
      <div className="tw:flex tw:gap-1 tw:items-center tw:@container">
        <div className="search-panel__input  tw:relative tw:grow tw:min-w-[220px] tw:max-w-xl">
          <Input
            type="text"
            value={queryState.search}
            placeholder="Find"
            main-field="true"
            autoFocus
            onKeyDown={handleInputKeyDown}
            onChange={event => handleQueryChange(event.target.value)}
          />
          <div className="tw:absolute tw:top-1/2 tw:-translate-y-1/2 tw:right-2 tw:flex tw:gap-1">
            <IconButton
              variant={queryState.caseSensitive ? 'primary' : 'secondary'}
              size="small"
              type="button"
              onClick={handleCaseSensitiveToggle}
              aria-label="Match Case"
              className="tw:text-sm!"
            >
              Aa
            </IconButton>

            <IconButton
              variant={queryState.wholeWord ? 'primary' : 'secondary'}
              size="small"
              type="button"
              onClick={handleWholeWordToggle}
              aria-label="Match Whole Word"
              className="tw:text-sm!"
            >
              [Ab]
            </IconButton>

            <IconButton
              variant={queryState.literal ? 'primary' : 'secondary'}
              size="small"
              type="button"
              onClick={handleLiteralToggle}
              aria-label="Use Regular Expression"
              className="tw:text-sm!"
            >
              .*
            </IconButton>
          </div>
        </div>

        <IconButton
          size="small"
          type="button"
          onClick={handleFindPrevious}
          aria-label="Previous (Shift+Enter)"
          title="Previous (Shift+Enter)"
          className="tw:@max-xs:hidden"
        >
          <Icon width={16} height={16} viewBox="0 0 16 16" name="arrow" />
        </IconButton>

        <IconButton size="small" aria-label="Next (Enter)" type="button" onClick={handleFindNext} title="Next (Enter)" className="tw:@max-xs:hidden">
          <Icon className="tw:rotate-180" width={16} height={16} viewBox="0 0 16 16" name="arrow" />
        </IconButton>

        <span className="tw:text-xs tw:px-1">
          {queryState.search &&
            searchMatchesCount &&
            (searchMatchesCount.count > 0 ? `${searchMatchesCount.current} of ${searchMatchesCount.count}` : 'No results')}
        </span>

        <IconButton size="small" aria-label="Toggle Replace" type="button" onClick={handleToggleReplace} title="Toggle Replace">
          <Icon width={16} height={16} viewBox="0 0 16 16" name="arrow" />
        </IconButton>

        <IconButton
          variant="secondary"
          size="small"
          className="tw:ml-auto!"
          aria-label="Close (Escape)"
          type="button"
          onClick={handleClose}
          title="Close (Escape)"
        >
          <Icon width={16} height={16} viewBox="0 0 16 16" name="cross" />
        </IconButton>
      </div>

      {showReplace && (
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:grow tw:max-w-xl">
            <Input
              type="text"
              value={queryState.replace}
              placeholder="Replace"
              onKeyDown={handleReplaceKeyDown}
              onChange={event => handleReplaceChange(event.target.value)}
              className="tw:min-w-[220px]"
            />
          </div>

          <IconButton size="small" type="button" onClick={handleReplaceNext} aria-label="Replace Next">
            R
          </IconButton>

          <IconButton size="small" type="button" onClick={handleReplaceAll} aria-label="Replace All">
            All
          </IconButton>
        </div>
      )}
    </div>
  );
});

export function createSearchPanel(view: EditorView): Panel {
  const dom = document.createElement('div');
  const root = createRoot(dom);

  root.render(<SearchPanel view={view} />);

  return {
    top: true,
    dom,
    update(update) {
      const searchQuery = getSearchQuery(update.state);
      const searchMatchesCount = getSearchMatchesCount(update.state, searchQuery);
      root.render(<SearchPanel view={update.view} searchMatchesCount={searchMatchesCount} />);
    },
  };
}
