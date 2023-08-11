/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { useEffect, useRef } from 'react';
import type { MenuStateReturn } from 'reakit';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { type IDatabaseDataModel, type IDatabaseResultSet, ResultSetViewAction } from '@cloudbeaver/plugin-data-viewer';

export interface Hint {
  key: string;
  value: string;
  icon?: string | React.ReactElement;
  title?: string;
}

export interface HintsState {
  inputValue: string;
  changed: boolean;
  indexToSearchFrom: number;
  inputRef: React.RefObject<HTMLInputElement> | null;
  menuRef: React.RefObject<HTMLDivElement>;
  menu: MenuStateReturn;
  updateInputValue: (newValue: string) => void;
  readonly filteredHints: Hint[];
  separatorLastIndex: number;
  toggleHints: () => void;
  getChangedValue: (hint: string) => string;
}

export function useHints(
  menu: MenuStateReturn,
  hints?: Hint[],
  model?: IDatabaseDataModel<any, IDatabaseResultSet>,
  resultIndex?: number,
  mapColumnsToHint?: (columns: SqlResultColumn[]) => Hint[],
): HintsState {
  const menuRef = useRef<HTMLDivElement>(null);

  if (model && resultIndex !== undefined && mapColumnsToHint && model.source.hasResult(resultIndex)) {
    hints = mapColumnsToHint(model.source.getAction(resultIndex, ResultSetViewAction).columns);
  }

  const state: HintsState = useObservableRef(
    () => ({
      inputValue: '',
      changed: false,
      indexToSearchFrom: 0,
      inputRef: null,
      menuRef,
      menu,
      updateInputValue(newValue: string) {
        this.inputValue = newValue;
        this.changed = true;
        this.indexToSearchFrom = this.separatorLastIndex;

        if (this.filteredHints.length === 0 && this.menu.visible) {
          this.menu.hide();
        }
        if (this.filteredHints.length !== 0 && !this.menu.visible) {
          this.menu.show();
        }
      },
      get filteredHints() {
        if (!this.hints) {
          return [];
        }

        const filterValue = this.inputValue.substring(this.indexToSearchFrom);
        const result = this.hints.filter(
          hint =>
            !filterValue.trim() ||
            hint.value.toUpperCase().includes(filterValue.trim().toUpperCase()) ||
            filterValue.toUpperCase().includes(hint.value.toUpperCase()),
        );

        return result;
      },
      get separatorLastIndex() {
        let lastIndex = this.inputValue.trim().lastIndexOf(' ');
        lastIndex = lastIndex === -1 ? 0 : lastIndex;
        return lastIndex;
      },
      toggleHints() {
        if (this.filteredHints.length !== 0) {
          if (this.menu.visible) {
            this.menu.hide();
          } else {
            this.menu.show();
          }
        }
      },
      getChangedValue(hint: string) {
        const lastWordCroppedValue = this.inputValue.trim().substring(0, this.separatorLastIndex);
        const changedValue = lastWordCroppedValue.trim().length ? lastWordCroppedValue + ' ' + hint : hint;
        const indexToSearchFrom = this.inputValue.length - this.separatorLastIndex;

        this.changed = false;
        this.indexToSearchFrom = indexToSearchFrom;

        return changedValue;
      },
    }),
    {
      menu: observable.ref,
      hints: observable.ref,
      model: observable.ref,
      changed: observable.ref,
      indexToSearchFrom: observable.ref,
      inputValue: observable.ref,
      updateInputValue: action.bound,
      inputRef: observable.ref,
      menuRef: observable.ref,
      filteredHints: computed,
      separatorLastIndex: computed,
      getChangedValue: action.bound,
      toggleHints: action.bound,
    },
    { menu, hints, model },
  );

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

  return state;
}
