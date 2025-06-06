/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SearchQuery } from '@codemirror/search';
import { useState } from 'react';

import { Icon, useTranslate } from '@cloudbeaver/core-blocks';
import { clsx, IconButton, Input } from '@dbeaver/ui-kit';

import './SearchPanel.css';

interface SearchPanelProps {
  searchMatchesCount?: { count: number; current: number };
  queryState: SearchQuery;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onCaseSensitiveToggle: () => void;
  onLiteralToggle: () => void;
  onWholeWordToggle: () => void;
  onReplaceChange: (value: string) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onReplaceAll: () => void;
  onReplaceNext: () => void;
  onClose: () => void;
}

export function SearchPanel({
  searchMatchesCount,
  queryState,
  inputRef,
  onQueryChange,
  onCaseSensitiveToggle,
  onLiteralToggle,
  onWholeWordToggle,
  onReplaceChange,
  onFindNext,
  onFindPrevious,
  onReplaceAll,
  onReplaceNext,
  onClose,
}: SearchPanelProps) {
  const [showReplace, setShowReplace] = useState(false);
  const translate = useTranslate();

  function handleToggleReplace() {
    setShowReplace(prev => !prev);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        onFindPrevious();
      } else {
        onFindNext();
      }
    }
  }

  function handleReplaceKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        onReplaceAll();
      } else {
        onReplaceNext();
      }
    }
  }

  return (
    <div className="search-panel" onKeyDown={handleKeyDown}>
      <IconButton
        className={clsx(showReplace ? 'tw:h-[56px]!' : 'tw:h-[26px]!')}
        size="small"
        aria-label={translate('plugin_codemirror_search_replace_toggle')}
        type="button"
        title={translate('plugin_codemirror_search_replace_toggle')}
        onClick={handleToggleReplace}
      >
        <Icon className={clsx(showReplace && 'tw:rotate-180')} width={16} height={16} viewBox="0 0 16 16" name="arrow" />
      </IconButton>
      <div className="tw:grow tw:shrink">
        <div className="search-panel__row">
          <div className="search-panel__input">
            <Input
              ref={inputRef}
              value={queryState.search}
              placeholder={translate('plugin_codemirror_search_input_placeholder')}
              main-field="true"
              onKeyDown={handleInputKeyDown}
              onChange={event => onQueryChange(event.target.value)}
            />
            <div className="tw:absolute tw:top-1/2 tw:-translate-y-1/2 tw:right-2 tw:flex tw:gap-1">
              <IconButton
                variant={queryState.caseSensitive ? 'primary' : 'secondary'}
                size="small"
                type="button"
                aria-label={translate('plugin_codemirror_search_case_sensitive')}
                title={translate('plugin_codemirror_search_case_sensitive')}
                className="tw:text-sm!"
                onClick={onCaseSensitiveToggle}
              >
                Aa
              </IconButton>

              <IconButton
                variant={queryState.wholeWord ? 'primary' : 'secondary'}
                size="small"
                type="button"
                aria-label={translate('plugin_codemirror_search_whole_word')}
                title={translate('plugin_codemirror_search_whole_word')}
                className="tw:text-sm!"
                onClick={onWholeWordToggle}
              >
                [Ab]
              </IconButton>

              <IconButton
                variant={queryState.literal ? 'primary' : 'secondary'}
                size="small"
                type="button"
                aria-label={translate('plugin_codemirror_search_literal')}
                title={translate('plugin_codemirror_search_literal')}
                className="tw:text-sm!"
                onClick={onLiteralToggle}
              >
                .*
              </IconButton>
            </div>
          </div>

          {queryState.search && searchMatchesCount && (
            <span className="search-panel__matches">
              {searchMatchesCount.count > 0
                ? `${searchMatchesCount.current} ${translate('plugin_codemirror_search_matches_of')} ${searchMatchesCount.count}`
                : translate('plugin_codemirror_search_matches_none')}
            </span>
          )}

          <IconButton
            size="small"
            type="button"
            aria-label={translate('plugin_codemirror_search_find_previous')}
            title={translate('plugin_codemirror_search_find_previous')}
            className="search-panel__find"
            onClick={onFindPrevious}
          >
            <Icon width={16} height={16} viewBox="0 0 16 16" name="arrow" />
          </IconButton>

          <IconButton
            size="small"
            aria-label={translate('plugin_codemirror_search_find_next')}
            type="button"
            title={translate('plugin_codemirror_search_find_next')}
            className="search-panel__find"
            onClick={onFindNext}
          >
            <Icon className="tw:rotate-180" width={16} height={16} viewBox="0 0 16 16" name="arrow" />
          </IconButton>

          <IconButton
            variant="secondary"
            size="small"
            aria-label={translate('plugin_codemirror_search_close')}
            type="button"
            title={translate('plugin_codemirror_search_close')}
            className="tw:ml-auto!"
            onClick={onClose}
          >
            <Icon width={16} height={16} viewBox="0 0 16 16" name="cross" />
          </IconButton>
        </div>

        {showReplace && (
          <div className="search-panel__row">
            <div className="search-panel__replace-input">
              <Input
                value={queryState.replace}
                placeholder={translate('plugin_codemirror_search_replace')}
                onKeyDown={handleReplaceKeyDown}
                onChange={event => onReplaceChange(event.target.value)}
              />
            </div>

            <IconButton
              size="small"
              type="button"
              aria-label={translate('plugin_codemirror_search_replace')}
              title={translate('plugin_codemirror_search_replace')}
              onClick={onReplaceNext}
            >
              R
            </IconButton>

            <IconButton
              size="small"
              type="button"
              aria-label={translate('plugin_codemirror_search_replace_all')}
              title={translate('plugin_codemirror_search_replace_all')}
              onClick={onReplaceAll}
            >
              All
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}
