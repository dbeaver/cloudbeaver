/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { type RefObject, useEffect, useMemo } from 'react';

import { debounce, isNotNullDefined } from '@cloudbeaver/core-utils';

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
  score?: number;
}

interface State {
  replaceCurrentWord: (replacement: string) => void;
  currentWord: string;
}

const INPUT_DELAY = 300;
const SEARCH_FIELDS: Array<keyof InputAutocompleteProposal> = ['displayString', 'replacementString'];

export const useInputAutocomplete = (
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  { sourceHints, matchStrategy = 'contains', predicate }: InputAutocompleteOptions,
): [State, InputAutocompleteProposal[]] => {
  const { searchResult, setSearch } = useSearch({
    sourceHints,
    searchFields: SEARCH_FIELDS,
    matchStrategy,
    predicate,
  });

  const state = useObservableRef(
    () => ({
      isFound: false,
      input: inputRef.current?.value as string | undefined,
      selectionStart: inputRef.current?.selectionStart ?? null,
      replaceCurrentWord(replacement: string) {
        const cursorPosition = this.selectionStart;
        const words = this.input?.split(' ');

        if (!this.currentWord || !isNotNullDefined(words) || !isNotNullDefined(cursorPosition)) {
          return;
        }

        const start = cursorPosition - this.currentWord.length;
        const end = cursorPosition;

        this.input = this.input?.slice(0, start) + replacement + this.input?.slice(end);
        this.selectionStart = start + replacement.length;

        if (this.inputRef.current) {
          this.inputRef.current.value = this.input;
          this.inputRef.current.focus();
        }

        this.isFound = true;
      },
      get currentWord(): string {
        const cursorPosition = this.selectionStart;

        if (!cursorPosition) {
          return '';
        }

        const substring = this.input?.slice(0, cursorPosition);

        if (!substring) {
          return '';
        }

        return substring.split(' ').at(-1) ?? '';
      },
    }),
    {
      input: observable.ref,
      selectionStart: observable.ref,
      isFound: observable.ref,
      currentWord: computed,
      replaceCurrentWord: action.bound,
    },
    { sourceHints, matchStrategy, inputRef, setSearch },
  );

  const handleInput = useMemo(
    () =>
      debounce((event: Event) => {
        const target = event.target as HTMLInputElement;

        state.selectionStart = target.selectionStart;
        state.input = target.value;
        state.isFound = false;
        state.setSearch(state.currentWord);
      }, INPUT_DELAY),
    [state],
  );

  useEffect(() => {
    const input = state.inputRef.current;

    if (!input) {
      return;
    }

    input.addEventListener('input', handleInput);
    return () => {
      input.removeEventListener('input', handleInput);
    };
  }, [state.inputRef.current]);

  return [state as State, state.isFound ? [] : searchResult];
};
