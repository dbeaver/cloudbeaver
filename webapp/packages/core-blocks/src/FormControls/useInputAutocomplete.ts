/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { debounce } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import type { IMenuState } from '../Menu/MenuStateContext.js';
import type { IContextMenuPositionCoords } from '../Menu/useContextMenuPosition.js';
import { useObservableRef } from '../useObservableRef.js';
import { type SearchStrategy, useSearch } from '../useSearch.js';

export type InputAutocompleteStrategy = 'startsWith' | 'contains' | 'fuzzy';

interface InputAutocompleteOptions {
  sourceHints: InputAutocompleteProposal[];
  separator?: string | RegExp;
  matchStrategy?: SearchStrategy;
  predicate?: (suggestion: InputAutocompleteProposal, lastWord?: string) => boolean;
}

export interface InputAutocompleteProposal {
  displayString: string;
  replacementString: string;
  icon?: string;
  title?: string;
}

interface State {
  replaceCurrentWord: (replacement: string) => void;
  currentWord: string;
  proposals: InputAutocompleteProposal[];
  position: IContextMenuPositionCoords;
  inputValue: string;
  menuRef: RefObject<IMenuState>;
}

const DEFAULT_SEPARATOR = ' ';
const INPUT_DELAY = 300;
const SEARCH_FIELDS: Array<keyof InputAutocompleteProposal> = ['displayString', 'replacementString'];
const CONTEXT_INPUT_OFFSET_Y = 3;

export const useInputAutocomplete = (
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  { sourceHints, separator = DEFAULT_SEPARATOR, matchStrategy = 'contains', predicate }: InputAutocompleteOptions,
): Readonly<State> => {
  const search = useSearch({
    sourceHints,
    searchFields: SEARCH_FIELDS,
    matchStrategy,
    predicate,
  });
  const menuRef = useRef<IMenuState>(null);
  const state = useObservableRef(
    () => ({
      position: { x: 0, y: 0 } as IContextMenuPositionCoords,
      inputValue: '',
      isFound: false,
      selectionStart: 0 as number | null,
      replaceCurrentWord(replacement: string) {
        try {
          const cursorPosition = this.selectionStart;
          const words = this.inputValue.split(separator);

          if (!this.currentWord || !isNotNullDefined(words) || !isNotNullDefined(cursorPosition)) {
            return;
          }

          const start = cursorPosition - this.currentWord.length;
          const end = cursorPosition;

          this.inputValue = this.inputValue.slice(0, start) + replacement + this.inputValue.slice(end);
          this.selectionStart = start + replacement.length;

          if (this.inputRef.current) {
            this.inputRef.current.value = this.inputValue;
            this.inputRef.current.focus();
            this.inputRef.current.setSelectionRange(this.selectionStart, this.selectionStart);
          }

          this.isFound = true;
        } finally {
          this.resetState();
        }
      },
      get currentWord(): string {
        const cursorPosition = this.selectionStart;

        if (!cursorPosition) {
          return '';
        }

        const substring = this.inputValue.slice(0, cursorPosition);

        if (!substring) {
          return '';
        }

        return substring.split(separator).at(-1) ?? '';
      },
      get proposals() {
        if (this.isFound || !this.currentWord) {
          return [];
        }

        return this.search.searchResult;
      },
      resetState() {
        this.selectionStart = null;
        this.position = { x: 0, y: 0 };
      },
    }),
    {
      proposals: computed,
      selectionStart: observable.ref,
      isFound: observable.ref,
      currentWord: computed,
      resetState: action.bound,
      replaceCurrentWord: action.bound,
      position: observable.ref,
      inputValue: observable.ref,
    },
    { inputRef, search, menuRef },
  );

  const handleInput = useMemo(
    () =>
      debounce((event: Event) => {
        const target = event.target as HTMLInputElement;

        state.selectionStart = target.selectionStart;
        state.inputValue = target.value;
        state.isFound = false;
        state.search.setSearch(state.currentWord);
      }, INPUT_DELAY),
    [state],
  );

  function handleKeyDown(event: any) {
    switch (event.key) {
      case 'Escape':
        state.menuRef.current?.hide();
        state.resetState();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        state.menuRef.current?.first();
        break;
      case 'Tab':
        state.resetState();
        break;
      default:
        break;
    }
  }

  function handleOutsideClick() {
    if (state.inputRef.current?.contains(document.activeElement)) {
      return;
    }

    state.resetState();
  }

  useEffect(() => {
    const input = state.inputRef.current!;

    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleOutsideClick);

    return () => {
      input.removeEventListener('keydown', handleKeyDown);
      input.removeEventListener('input', handleInput);
      document.removeEventListener('click', handleOutsideClick);
    };
  });

  useLayoutEffect(() => {
    const inputElement = inputRef.current!;
    const caretPosition = inputElement.selectionStart || 0;
    const inputStyle = window.getComputedStyle(inputElement);

    const span = document.createElement('span');
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    span.style.fontFamily = inputStyle.fontFamily;
    span.style.fontSize = inputStyle.fontSize;
    span.style.fontWeight = inputStyle.fontWeight;
    span.style.letterSpacing = inputStyle.letterSpacing;
    span.style.lineHeight = inputStyle.lineHeight;
    span.textContent = inputElement.value.slice(0, caretPosition);

    document.body.appendChild(span);
    const spanRect = span.getBoundingClientRect();
    const letterWidth = spanRect.width / span.textContent.length;
    document.body.removeChild(span);

    state.position = {
      x: spanRect.width + letterWidth,
      y: spanRect.height + CONTEXT_INPUT_OFFSET_Y,
    };
  }, [state.inputValue]);

  return state as Readonly<State>;
};
