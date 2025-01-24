/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { type RefObject, useEffect, useLayoutEffect, useMemo } from 'react';

import { debounce, isNotNullDefined } from '@cloudbeaver/core-utils';

import type { IContextMenuPositionCoords } from '../Menu/useContextMenuPosition.js';
import { useObservableRef } from '../useObservableRef.js';
import { type SearchStrategy, useSearch } from '../useSearch.js';

export type InputAutocompleteStrategy = 'startsWith' | 'contains' | 'fuzzy';

interface InputAutocompleteOptions {
  sourceHints: InputAutocompleteProposal[];
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
}

const INPUT_DELAY = 300;
const SEARCH_FIELDS: Array<keyof InputAutocompleteProposal> = ['displayString', 'replacementString'];
const CONTEXT_INPUT_OFFSET_Y = 3;

export const useInputAutocomplete = (
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  { sourceHints, matchStrategy = 'contains', predicate }: InputAutocompleteOptions,
): Readonly<State> => {
  const search = useSearch({
    sourceHints,
    searchFields: SEARCH_FIELDS,
    matchStrategy,
    predicate,
  });

  const state = useObservableRef(
    () => ({
      position: { x: 0, y: 0 } as IContextMenuPositionCoords,
      inputValue: '',
      isFound: false,
      selectionStart: 0 as number | null,
      replaceCurrentWord(replacement: string) {
        const cursorPosition = this.selectionStart;
        const words = this.inputValue.split(' ');

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

        return substring.split(' ').at(-1) ?? '';
      },
      get proposals() {
        if (this.isFound || !this.currentWord) {
          return [];
        }

        return this.search.searchResult ?? [];
      },
    }),
    {
      proposals: computed,
      selectionStart: observable.ref,
      isFound: observable.ref,
      currentWord: computed,
      replaceCurrentWord: action.bound,
      position: observable.ref,
      inputValue: observable.ref,
    },
    { inputRef, search },
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

  useEffect(() => {
    const input = state.inputRef.current!;

    input.addEventListener('input', handleInput);
    return () => {
      input.removeEventListener('input', handleInput);
    };
  }, []);

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
