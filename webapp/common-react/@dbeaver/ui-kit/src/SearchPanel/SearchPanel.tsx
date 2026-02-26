/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { clsx } from 'clsx';
import { forwardRef, type KeyboardEvent, useImperativeHandle, useRef, useState } from 'react';
import { EventContext, EventStopPropagationFlag } from '@dbeaver/js-helpers';
import { useTranslate } from '@dbeaver/react-translate';

import { Icon } from '../Icon/Icon.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Input } from '../Input/Input.js';

import './SearchPanel.css';

export interface SearchPanelRef {
  focus: () => void;
}

export interface SearchPanelQuery {
  search: string;
  replace?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regexp?: boolean;
}

export interface SearchPanelStrings {
  searchPlaceholder: string;
  replacePlaceholder: string;
  toggleReplace: string;
  caseSensitive: string;
  wholeWord: string;
  regex: string;
  findPrevious: string;
  findNext: string;
  replace: string;
  replaceAll: string;
  close: string;
  matchesOf: string;
  matchesNone: string;
}

export interface SearchPanelProps {
  isReadOnly?: boolean;
  query: SearchPanelQuery;
  searchMatchesCount?: { count: number; current: number };
  className?: string;
  enableReplace?: boolean;
  enableRegex?: boolean;
  enableWholeWord?: boolean;
  enableCaseSensitive?: boolean;
  defaultShowReplace?: boolean;
  onQueryChange: (value: string) => void;
  onCaseSensitiveToggle?: () => void;
  onRegexToggle?: () => void;
  onWholeWordToggle?: () => void;
  onReplaceChange?: (value: string) => void;
  onReplaceToggle?: (show: boolean) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onReplaceAll?: () => void;
  onReplaceNext?: () => void;
  onClose: () => void;
}

export const SearchPanel = forwardRef<SearchPanelRef, SearchPanelProps>(function SearchPanel(
  {
    isReadOnly,
    query,
    className,
    searchMatchesCount,
    enableReplace = true,
    enableRegex = true,
    enableWholeWord = true,
    enableCaseSensitive = true,
    defaultShowReplace,
    onQueryChange,
    onCaseSensitiveToggle,
    onRegexToggle,
    onWholeWordToggle,
    onReplaceChange,
    onReplaceToggle,
    onFindNext,
    onFindPrevious,
    onReplaceAll,
    onReplaceNext,
    onClose,
  },
  ref,
) {
  const [showReplace, setShowReplace] = useState(defaultShowReplace ?? false);
  const translate = useTranslate();
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
    }),
    [],
  );

  function handleToggleReplace() {
    setShowReplace(prevShowReplace => {
      const next = !prevShowReplace;
      onReplaceToggle?.(next);
      return next;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  function handleKeyDownCapture(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      EventContext.set(event.nativeEvent, EventStopPropagationFlag);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        onFindPrevious();
      } else {
        onFindNext();
      }
    }
  }

  function handleReplaceKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        onReplaceAll?.();
      } else {
        onReplaceNext?.();
      }
    }
  }

  return (
    <div className={clsx('search-panel', className)} onKeyDownCapture={handleKeyDownCapture} onKeyDown={handleKeyDown}>
      {!isReadOnly && enableReplace && (
        <IconButton
          className={clsx(showReplace ? 'tw:h-[56px]!' : 'tw:h-[26px]!')}
          size="small"
          aria-label={translate('ui_search_panel_replace_toggle', 'Toggle replace')}
          type="button"
          title={translate('ui_search_panel_replace_toggle', 'Toggle replace')}
          onClick={handleToggleReplace}
        >
          <Icon className={clsx(showReplace && 'tw:rotate-180')} size="small" name="chevron" />
        </IconButton>
      )}

      <div className="search-panel__inputs">
        <div className="search-panel__input">
          <Input
            ref={inputRef}
            value={query.search}
            placeholder={translate('ui_search_panel_input_placeholder', 'Find')}
            main-field="true"
            onKeyDown={handleInputKeyDown}
            onChange={event => onQueryChange(event.target.value)}
          />
          <div className="tw:pr-1 tw:flex tw:gap-1">
            {enableCaseSensitive && (
              <IconButton
                variant={query.caseSensitive ? 'primary' : 'secondary'}
                size="small"
                type="button"
                aria-label={translate('ui_search_panel_case_sensitive', 'Match case')}
                title={translate('ui_search_panel_case_sensitive', 'Match case')}
                className="tw:text-sm!"
                onClick={onCaseSensitiveToggle}
              >
                <Icon name="case" />
              </IconButton>
            )}

            {enableWholeWord && (
              <IconButton
                variant={query.wholeWord ? 'primary' : 'secondary'}
                size="small"
                type="button"
                aria-label={translate('ui_search_panel_whole_word', 'Match whole word')}
                title={translate('ui_search_panel_whole_word', 'Match whole word')}
                className="tw:text-sm!"
                onClick={onWholeWordToggle}
              >
                <Icon name="match-word" />
              </IconButton>
            )}

            {enableRegex && (
              <IconButton
                variant={query.regexp ? 'primary' : 'secondary'}
                size="small"
                type="button"
                aria-label={translate('ui_search_panel_literal', 'Use regex')}
                title={translate('ui_search_panel_literal', 'Use regex')}
                className="tw:text-sm!"
                onClick={onRegexToggle}
              >
                <Icon name="regex" />
              </IconButton>
            )}
          </div>
        </div>
        {showReplace && (
          <div className="search-panel__replace-input">
            <Input
              value={query.replace}
              placeholder={translate('ui_search_panel_replace', 'Replace')}
              onKeyDown={handleReplaceKeyDown}
              onChange={event => onReplaceChange?.(event.target.value)}
            />
          </div>
        )}
      </div>
      <div className="search-panel__buttons">
        <div className="search-panel__row">
          {query.search && searchMatchesCount && (
            <span className="search-panel__matches">
              {searchMatchesCount.count > 0
                ? `${searchMatchesCount.current} ${translate('ui_search_panel_matches_of', 'of')} ${searchMatchesCount.count}`
                : translate('ui_search_panel_matches_none', 'No matches')}
            </span>
          )}

          <IconButton
            size="small"
            type="button"
            aria-label={translate('ui_search_panel_find_previous', 'Find previous')}
            title={translate('ui_search_panel_find_previous', 'Find previous')}
            className="search-panel__find"
            onClick={onFindPrevious}
          >
            <Icon name="arrow-up" />
          </IconButton>

          <IconButton
            size="small"
            aria-label={translate('ui_search_panel_find_next', 'Find next')}
            type="button"
            title={translate('ui_search_panel_find_next', 'Find next')}
            className="search-panel__find"
            onClick={onFindNext}
          >
            <Icon name="arrow-down" />
          </IconButton>

          <IconButton
            variant="secondary"
            size="small"
            aria-label={translate('ui_search_panel_close', 'Close')}
            type="button"
            title={translate('ui_search_panel_close', 'Close')}
            onClick={onClose}
          >
            <Icon name="cross" size="medium" className="tw:h-[16px]" />
          </IconButton>
        </div>

        {showReplace && (
          <div className="search-panel__row">
            <IconButton
              size="small"
              type="button"
              aria-label={translate('ui_search_panel_replace', 'Replace')}
              title={translate('ui_search_panel_replace', 'Replace')}
              onClick={onReplaceNext}
            >
              <Icon name="replace" />
            </IconButton>

            <IconButton
              size="small"
              type="button"
              aria-label={translate('ui_search_panel_replace_all', 'Replace all')}
              title={translate('ui_search_panel_replace_all', 'Replace all')}
              onClick={onReplaceAll}
            >
              <Icon name="replace-all" />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
});
