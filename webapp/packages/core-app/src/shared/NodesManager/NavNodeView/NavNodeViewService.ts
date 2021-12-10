/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { untracked } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { NavTreeResource } from '../NavTreeResource';
import type { NavNodeTransformView, INavNodeFolderTransform, NavNodeFolderTransformFn } from './IFolderTransform';

export interface INodeDuplicateList {
  nodes: string[];
  duplicates: string[];
}

@injectable()
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
    return this.transformers
      .sort(sortTransformations)
      .map(transform => transform.transformer);
  }

  private transformers: INavNodeFolderTransform[];
  private duplicationNotify: Set<string>;

  constructor(
    private navTreeResource: NavTreeResource,
    private notificationService: NotificationService
  ) {
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
          this.logDuplicates(nodeId, duplicates);
        });

        return nodes;
      },
    });
  }

  getFolders(nodeId: string): string[] | undefined {
    const children = this.navTreeResource.get(nodeId);

    return this.transformations.reduce(
      (children, transform) => transform(nodeId, children),
      children
    );
  }

  addTransform(transform: INavNodeFolderTransform): void {
    this.transformers.push(transform);
  }

  filterDuplicates(nodes: string[]): INodeDuplicateList {
    const nextChildren: string[] = [];
    const duplicates: string[] = [];

    for (const child of nodes) {
      if (nextChildren.includes(child)) {
        if (!duplicates.includes(child)) {
          duplicates.push(child);
          nextChildren.splice(nextChildren.indexOf(child), 1);
        }
      } else {
        nextChildren.push(child);
      }
    }

    return {
      nodes: nextChildren,
      duplicates,
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

function sortTransformations(
  { order: orderA }: INavNodeFolderTransform,
  { order: orderB }: INavNodeFolderTransform
): number {
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
