/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable, type ObservableSet } from 'mobx';
import { useState } from 'react';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { MetadataMap } from '@cloudbeaver/core-utils';
import type { INodeSelection, ITreeCheckboxSelection } from '@cloudbeaver/plugin-navigation-tree';

interface Options {
  selectedIds: string[];
  allObjects: boolean;
  getParents(id: string): string[];
  canSelect(id: string): boolean;
}

interface IAiScopeSelection extends ITreeCheckboxSelection {
  readonly selectedIds: ObservableSet<string>;
  allObjects: boolean;
  setAllObjects(value: boolean): void;
  isInherited(id: string): boolean;
}

/** Selecting a container includes unloaded descendants without traversing the database. */
export function useAiScopeSelection(options: Options): Readonly<IAiScopeSelection> {
  const optionsRef = useObjectRef(options);
  const [selectionState] = useState<MetadataMap<string, INodeSelection>>(
    () =>
      new MetadataMap<string, INodeSelection>(id => ({
        get selected(): boolean {
          return selection.isSelected(id);
        },
        get indeterminate(): boolean {
          return !selection.isSelected(id) && [...selection.selectedIds].some(selected => optionsRef.getParents(selected).includes(id));
        },
      })),
  );

  const selection: IAiScopeSelection = useObservableRef<IAiScopeSelection>(
    () => ({
      type: 'checkbox',
      selectionState,
      selectedIds: observable.set(optionsRef.selectedIds),
      allObjects: optionsRef.allObjects,
      setAllObjects(value: boolean): void {
        this.allObjects = value;
      },
      isInherited(id: string): boolean {
        return this.allObjects || optionsRef.getParents(id).some(parent => this.selectedIds.has(parent));
      },
      isSelected(id: string): boolean {
        return this.selectedIds.has(id) || this.isInherited(id);
      },
      getSelection(id: string): INodeSelection {
        return selectionState.get(id);
      },
      select(id: string, selected?: boolean): void {
        if (optionsRef.canSelect(id) && !this.isInherited(id)) {
          if (selected ?? !this.isSelected(id)) {
            this.selectedIds.add(id);
          } else {
            this.selectedIds.delete(id);
          }
        }
      },
      clear(): void {
        this.selectedIds.clear();
        this.allObjects = false;
      },
      selectAll(): void {
        this.allObjects = true;
      },
    }),
    { allObjects: observable.ref, setAllObjects: action.bound, select: action.bound, clear: action.bound, selectAll: action.bound },
    false,
    ['getSelection', 'isSelected', 'isInherited'],
  );
  return selection;
}
