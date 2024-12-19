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

interface InputAutocompleteOptions {
  sourceHints: InputAutocompleteProposal[];
  matchStrategy?: 'startsWith' | 'contains' | 'fuzzy';
  onSelect: (suggestion: InputAutocompleteProposal) => void;
  onClose: () => void;
  filter?: (suggestion: InputAutocompleteProposal, lastWord?: string) => boolean;
}

export interface InputAutocompleteProposal {
  displayString: string;
  replacementString: string;
  title?: string;
  score?: number;
}

const SELECTED_INDEX_DEFAULT = -1;
const INPUT_DELAY = 300;

export const useInputAutocomplete = (
  inputRef: RefObject<HTMLInputElement>,
  { sourceHints, matchStrategy = 'startsWith', onSelect, filter, onClose }: InputAutocompleteOptions,
) => {
  const state = useObservableRef(
    () => ({
      input: inputRef.current?.value as string | undefined,
      selectionStart: inputRef.current?.selectionStart ?? null,
      selectionEnd: inputRef.current?.value?.length ?? null,
      selectedIndex: SELECTED_INDEX_DEFAULT,
      setSelectedIndex(index: number) {
        if (index < SELECTED_INDEX_DEFAULT) {
          throw new Error(`Index cannot be less than ${SELECTED_INDEX_DEFAULT}`);
        }

        this.selectedIndex = index;
      },
      get selected() {
        return this.filteredSuggestions[this.selectedIndex];
      },
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
        input.value = this.input;
        input.setSelectionRange(start, start + replacement.length);
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

        return substring.split(' ').filter(Boolean).at(-1);
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
                values.some(value => isNotNullDefined(this.currentWord) && isFuzzySearchable(value, this.currentWord)))
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
      selectedIndex: observable.ref,
      sourceHints: observable.ref,
      matchStrategy: observable.ref,
      inputRef: observable.ref,
      selected: computed,
      currentWord: computed,
      filteredSuggestions: computed,
      setSelectedIndex: action.bound,
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

  // TODO move it to the ui?
  function handleKeyDown(event: KeyboardEvent) {
    if (!state.filteredSuggestions.length) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        state.setSelectedIndex(Math.min(state.selectedIndex + 1, state.filteredSuggestions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        state.setSelectedIndex(Math.max(state.selectedIndex - 1, 0));
        break;
      case 'Enter':
        if (state.selected) {
          event.preventDefault();
          event.stopPropagation();
          state.replaceCurrentWord(state.selected.replacementString);
          state.setSelectedIndex(SELECTED_INDEX_DEFAULT);
          onSelect(state.selected);
        }
        break;
      case 'Escape':
        state.setSelectedIndex(SELECTED_INDEX_DEFAULT);
        onClose();
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    const input = state.inputRef.current;

    if (!input) {
      return;
    }

    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeyDown);
    return () => {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.inputRef.current]);

  // TODO move it to the ui?
  useEffect(() => {
    state.setSelectedIndex(SELECTED_INDEX_DEFAULT);
  }, [sourceHints, matchStrategy]);

  return state;
};
