/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { untracked } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import type { INavNodeFolderTransform, NavNodeFolderTransformFn, NavNodeTransformView } from './IFolderTransform.js';

export interface INodeDuplicateList {
  nodes: Set<string>;
  duplicates: Set<string>;
}

export interface INodeLimitedList {
  nodes: string[];
  truncated: number;
}

@injectable(() => [NotificationService])
export class NavNodeViewService {
  get tabs(): NavNodeTransformView[] {
    return this.transformers
      .filter(transform => transform.tab)
      .sort(sortTransformations)
      .map(transform => transform.tab!);
  }

  get panels(): NavNodeTransformView[] {
    return this.transformers
      .filter(transform => transform.panel)
      .sort(sortTransformations)
      .map(transform => transform.panel!);
  }

  get transformations(): NavNodeFolderTransformFn[] {
    return this.transformers.sort(sortTransformations).map(transform => transform.transformer);
  }

  private readonly transformers: INavNodeFolderTransform[];
  private readonly duplicationNotify: Set<string>;

  constructor(private readonly notificationService: NotificationService) {
    this.transformers = [];
    this.duplicationNotify = new Set();

    this.addTransform({
      order: 0,
      transformer: (nodeId, children) => {
        if (!children) {
          return children;
        }

        const { nodes, duplicates } = this.filterDuplicates(children);

        untracked(() => {
          this.logDuplicates(nodeId, Array.from(duplicates));
        });

        return Array.from(nodes);
      },
    });
  }

  getFolders(nodeId: string, children: string[] | undefined): string[] | undefined {
    if (!children) {
      return;
    }

    return this.transformations.reduce((children, transform) => transform(nodeId, children), children as string[] | undefined);
  }

  addTransform(transform: INavNodeFolderTransform): void {
    this.transformers.push(transform);
  }

  filterDuplicates(nodes: string[]): INodeDuplicateList {
    const seen = new Set<string>();
    const duplicatesSet = new Set<string>();
    const nextChildren: string[] = [];

    for (const child of nodes) {
      if (seen.has(child)) {
        duplicatesSet.add(child);
      } else {
        seen.add(child);
        nextChildren.push(child);
      }
    }

    const uniqueChildren = new Set(nextChildren.filter(child => !duplicatesSet.has(child)));

    return {
      nodes: uniqueChildren,
      duplicates: duplicatesSet,
    };
  }

  logDuplicates(nodeId: string, duplicates: string[]) {
    if (duplicates.length > 0 && !this.duplicationNotify.has(nodeId)) {
      this.duplicationNotify.add(nodeId);
      this.notificationService.logError({
        title: 'Node key duplication',
        message: 'Duplicate elements were hidden.',
        details: duplicates.join('\n'),
        onClose: () => this.duplicationNotify.delete(nodeId),
      });
    }
  }
}

function sortTransformations({ order: orderA }: INavNodeFolderTransform, { order: orderB }: INavNodeFolderTransform): number {
  if (orderA === orderB) {
    return 0;
  }

  if (orderA === undefined) {
    return 1;
  }

  if (orderB === undefined) {
    return -1;
  }

  return orderA - orderB;
}
