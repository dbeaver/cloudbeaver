/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { type RefObject, useEffect } from 'react';

import { debounce, isNotNullDefined, useFuzzySearch } from '@cloudbeaver/core-utils';

import { useObservableRef } from '../useObservableRef.js';

export type InputAutocompleteStrategy = 'startsWith' | 'contains' | 'fuzzy';

interface InputAutocompleteOptions {
  sourceHints: InputAutocompleteProposal[];
  matchStrategy?: InputAutocompleteStrategy;
  predicate?: (suggestion: InputAutocompleteProposal, lastWord?: string) => boolean;
}

export interface InputAutocompleteProposal {
  displayString: string;
  replacementString: string;
  icon?: string;
  title?: string;
  score?: number;
}

const INPUT_DELAY = 300;
const SEARCH_FIELDS: Array<keyof InputAutocompleteProposal> = ['displayString', 'replacementString'];

export const useInputAutocomplete = (
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  { sourceHints, matchStrategy = 'startsWith', predicate }: InputAutocompleteOptions,
) => {
  const { setFuzzySearchValue, fuzzySetsResults } = useFuzzySearch({
    dataSet: sourceHints,
    keys: SEARCH_FIELDS,
  });
  const state = useObservableRef(
    () => ({
      input: inputRef.current?.value as string | undefined,
      selectionStart: inputRef.current?.selectionStart ?? null,
      selectionEnd: inputRef.current?.value?.length ?? null,
      replaceCurrentWord(replacement: string) {
        const input = this.inputRef.current;

        if (!input) {
          return;
        }

        const cursorPosition = this.selectionStart;
        const words = this.input?.split(' ');

        if (!this.currentWord || !isNotNullDefined(words) || !isNotNullDefined(cursorPosition)) {
          return;
        }

        const start = cursorPosition - this.currentWord.length;
        const end = cursorPosition;

        this.input = this.input?.slice(0, start) + replacement + this.input?.slice(end);
        this.selectionStart = start + replacement.length;
        this.selectionEnd = start + replacement.length;

        input.value = this.input;
        input.focus();
      },
      get currentWord() {
        const cursorPosition = this.selectionStart;

        if (!cursorPosition) {
          return '';
        }

        const substring = this.input?.slice(0, cursorPosition);

        if (!substring) {
          return '';
        }

        return (
          substring
            .split(' ')
            .at(-1)
            ?.replace(/[^\w\s]|_/g, '') ?? ''
        );
      },
      get filteredSuggestions() {
        if (!this.currentWord) {
          return [];
        }

        if (this.matchStrategy === 'fuzzy') {
          return this.fuzzySetsResults.filter(suggestion => (predicate ? predicate(suggestion, this.currentWord) : true)).sort(sortByScore);
        }

        const matchFunctions: Record<Exclude<InputAutocompleteStrategy, 'fuzzy'>, (value: string) => boolean> = {
          startsWith: value => value.startsWith(this.currentWord),
          contains: value => value.includes(this.currentWord),
        };

        return this.sourceHints
          .filter(suggestion => {
            const values = SEARCH_FIELDS.map(field => suggestion[field]).filter(value => isNotNullDefined(value) && typeof value === 'string');
            const isEqual = values.some(value => value === this.currentWord?.toLocaleLowerCase());

            if (!this.currentWord || isEqual) {
              return false;
            }

            return values.some(matchFunctions[this.matchStrategy as Exclude<InputAutocompleteStrategy, 'fuzzy'>]);
          })
          .filter(suggestion => (predicate ? predicate(suggestion, this.currentWord) : true))
          .sort(sortByScore);
      },
    }),
    {
      input: observable.ref,
      selectionStart: observable.ref,
      selectionEnd: observable.ref,
      sourceHints: observable.ref,
      matchStrategy: observable.ref,
      inputRef: observable.ref,
      currentWord: computed,
      filteredSuggestions: computed,
      replaceCurrentWord: action.bound,
    },
    { sourceHints, matchStrategy, inputRef, fuzzySetsResults },
  );

  const handleInput = debounce((event: Event) => {
    const target = event.target as HTMLInputElement;

    state.selectionStart = target.selectionStart;
    state.selectionEnd = target.selectionEnd;
    state.input = target?.value;
    setFuzzySearchValue(target.value);
  }, INPUT_DELAY);

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

  return state;
};

function sortByScore(a: InputAutocompleteProposal, b: InputAutocompleteProposal) {
  if (isNotNullDefined(a.score) && isNotNullDefined(b.score)) {
    return b.score - a.score;
  }

  return 0;
}
