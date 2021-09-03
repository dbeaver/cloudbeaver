/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { NavTreeResource } from '../NavTreeResource';
import type { NavNodeTransformView, INavNodeFolderTransform, NavNodeFolderTransformFn } from './IFolderTransform';

@injectable()
export class NavNodeViewService {
  get tabs(): NavNodeTransformView[] {
    return this.transformers.map(transform => transform.tab);
  }

  get panels(): NavNodeTransformView[] {
    return this.transformers.map(transform => transform.panel);
  }

  get transformations(): NavNodeFolderTransformFn[] {
    return this.transformers.map(transform => transform.transformer);
  }

  private transformers: INavNodeFolderTransform[];

  constructor(
    private navTreeResource: NavTreeResource
  ) {
    this.transformers = [];
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
}
