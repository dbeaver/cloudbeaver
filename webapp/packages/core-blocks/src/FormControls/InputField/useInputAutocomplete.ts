/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { type RefObject, useEffect } from 'react';

import { debounce, isFuzzySearchable, isNotNullDefined } from '@cloudbeaver/core-utils';

import { useObservableRef } from '../../useObservableRef.js';

export type InputAutocompleteStrategy = 'startsWith' | 'contains' | 'fuzzy';

interface InputAutocompleteOptions {
  sourceHints: InputAutocompleteProposal[];
  matchStrategy?: InputAutocompleteStrategy;
  filter?: (suggestion: InputAutocompleteProposal, lastWord?: string) => boolean;
}

export interface InputAutocompleteProposal {
  displayString: string;
  replacementString: string;
  title?: string;
  score?: number;
}

const INPUT_DELAY = 300;

export const useInputAutocomplete = (
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  { sourceHints, matchStrategy = 'startsWith', filter }: InputAutocompleteOptions,
) => {
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

        if (!isNotNullDefined(words) || !isNotNullDefined(cursorPosition) || !isNotNullDefined(this.currentWord)) {
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

        return substring.split(' ').at(-1);
      },
      get filteredSuggestions() {
        if (!this.currentWord) {
          return [];
        }

        return this.sourceHints
          .filter(suggestion => {
            const values = [suggestion.displayString.toLocaleLowerCase(), suggestion.replacementString.toLocaleLowerCase()];
            const isEqual = values.some(value => value === this.currentWord?.toLocaleLowerCase());

            if (!this.currentWord || isEqual) {
              return false;
            }

            return (
              (this.matchStrategy === 'startsWith' &&
                values.some(value => isNotNullDefined(this.currentWord) && value.startsWith(this.currentWord))) ||
              (this.matchStrategy === 'contains' && values.some(value => isNotNullDefined(this.currentWord) && value.includes(this.currentWord))) ||
              (this.matchStrategy === 'fuzzy' &&
                values.some(value => isNotNullDefined(this.currentWord) && isFuzzySearchable(this.currentWord, value)))
            );
          })
          .filter(suggestion => (filter ? filter(suggestion, this.currentWord) : true))
          .sort((a, b) => {
            if (isNotNullDefined(a.score) && isNotNullDefined(b.score)) {
              return b.score - a.score;
            }

            return 0;
          });
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
    { sourceHints, matchStrategy, inputRef },
  );

  const handleInput = debounce((event: Event) => {
    const target = event.target as HTMLInputElement;

    state.selectionStart = target.selectionStart;
    state.selectionEnd = target.selectionEnd;
    state.input = target?.value;
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
