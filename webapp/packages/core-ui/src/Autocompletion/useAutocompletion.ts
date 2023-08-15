/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { useEffect, useRef } from 'react';
import { MenuInitialState, type MenuStateReturn, useMenuState } from 'reakit';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { debounce } from '@cloudbeaver/core-utils';

export interface IAutocompletion {
  key: string;
  value: string;
  icon?: string | React.ReactElement;
  title?: string;
}

interface AutocompletionState {
  inputRef: React.RefObject<HTMLInputElement> | null;
  autocompletionItems: IAutocompletion[] | null;
  inputValue: string;
  indexToSearchFrom: number;
  changed: boolean;
  readonly menuRef: React.RefObject<HTMLDivElement>;
  readonly menu: MenuStateReturn;
  filteredItems: IAutocompletion[];
  separatorLastIndex: number;
  isAutocompletionEnabled: boolean;
  getChangedValue: (value: string) => string;
  onSelect: (value: string) => void;
  onArrowDown: () => void;
  updateInputValue: (newValue: string) => void;
  toggleAutocompletion: () => void;
}

interface AutocompletionStateReturnType {
  state: AutocompletionState;
  updateInputValueForAutocompletion: (value: string) => void;
}

export const AUTOCOMPLETION_FILTER_DELAY = 250;

export function useAutocompletion(
  autocompletionItems?: IAutocompletion[],
  inputRef?: React.RefObject<HTMLInputElement>,
  onChange?: (value: string) => void,
  placement: MenuInitialState['placement'] = 'bottom-end',
  gutter = 1,
): AutocompletionStateReturnType {
  const menuRef = useRef<HTMLDivElement>(null);
  const menu = useMenuState({
    placement: placement,
    gutter: gutter,
  });

  const state = useObservableRef<AutocompletionState>(
    () => ({
      inputRef,
      autocompletionItems,
      inputValue: '',
      indexToSearchFrom: 0,
      changed: false,
      menuRef,
      menu,
      get filteredItems() {
        if (!this.autocompletionItems) {
          return [];
        }

        const filterValue = this.inputValue.substring(this.indexToSearchFrom).trim();
        return this.autocompletionItems.filter(
          item =>
            !filterValue ||
            item.value.toUpperCase().includes(filterValue.toUpperCase()) ||
            filterValue.toUpperCase().includes(item.value.toUpperCase()),
        );
      },
      get separatorLastIndex() {
        const lastIndex = this.inputValue.trim().lastIndexOf(' ');
        return lastIndex === -1 ? 0 : lastIndex;
      },
      get isAutocompletionEnabled() {
        return !!this.autocompletionItems;
      },
      getChangedValue(value: string) {
        const lastWordCroppedValue = this.inputValue.trim().substring(0, this.separatorLastIndex);
        const changedValue = lastWordCroppedValue.length ? lastWordCroppedValue + ' ' + value : value;
        const indexToSearchFrom = this.inputValue.length - this.separatorLastIndex;

        this.changed = false;
        this.indexToSearchFrom = indexToSearchFrom;

        return changedValue;
      },
      onSelect(value: string) {
        const newValue = this.getChangedValue(value);
        onChange?.(newValue);
      },
      onArrowDown() {
        if (this.isAutocompletionEnabled) {
          (this.menuRef.current?.children[0] as HTMLElement)?.focus();
        }
      },
      updateInputValue(newValue: string) {
        if (this.isAutocompletionEnabled) {
          this.inputValue = newValue;
          this.changed = true;
          this.indexToSearchFrom = this.separatorLastIndex;

          if (this.filteredItems.length === 0 && this.menu.visible) {
            this.menu.hide();
          }
          if (this.filteredItems.length !== 0 && !this.menu.visible) {
            this.menu.show();
          }
        }
      },
      toggleAutocompletion() {
        if (this.filteredItems.length !== 0) {
          if (this.menu.visible) {
            this.menu.hide();
          } else {
            this.menu.show();
          }
        }
      },
    }),
    {
      inputRef: observable.ref,
      autocompletionItems: observable.ref,
      inputValue: observable.ref,
      indexToSearchFrom: observable.ref,
      changed: observable.ref,
      menuRef: observable.ref,
      menu: observable.ref,
      filteredItems: computed,
      separatorLastIndex: computed,
      isAutocompletionEnabled: computed,
      getChangedValue: action.bound,
      onSelect: action.bound,
      onArrowDown: action.bound,
      updateInputValue: action.bound,
      toggleAutocompletion: action.bound,
    },
    { menu, autocompletionItems, inputRef },
  );

  const updateInputValueForAutocompletion = debounce((value: string) => {
    state.updateInputValue(value);
  }, AUTOCOMPLETION_FILTER_DELAY);

  useEffect(() => {
    if (!state.inputRef) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (menuRef.current && state.inputRef?.current) {
        const size = state.inputRef.current.getBoundingClientRect();
        menuRef.current.style.width = size.width + 'px';
      }
    });

    if (state.inputRef?.current) {
      resizeObserver.observe(state.inputRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [state.inputRef]);

  return { state, updateInputValueForAutocompletion };
}
