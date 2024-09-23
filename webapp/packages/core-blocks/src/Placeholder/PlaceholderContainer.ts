/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { type ILoadableState, uuid } from '@cloudbeaver/core-utils';

export type PlaceholderComponent<T extends Record<string, any> = Record<string, any>> = React.FunctionComponent<T>;

export interface PlaceholderElement<T extends Record<string, any> = Record<string, any>> {
  id: string;
  component: PlaceholderComponent<T>;
  isHidden?: (props: T) => boolean;
  order?: number;
  getLoaders?: (props: T) => ILoadableState[];
}

export class PlaceholderContainer<T extends Record<string, any> = Record<string, any>> {
  private readonly placeholders = observable<PlaceholderElement<T>>([], { deep: false });

  get(): Array<PlaceholderElement<T>> {
    return this.placeholders;
  }

  getDisplayed(props: T): Array<PlaceholderElement<T>> {
    return this.placeholders.filter(placeholder => !placeholder.isHidden?.(props));
  }

  add(component: PlaceholderComponent<T>, order?: number, isHidden?: (props: T) => boolean, getLoaders?: (props: T) => ILoadableState[]): void {
    const placeholder: PlaceholderElement<T> = {
      id: uuid(),
      component,
      order,
      isHidden,
      getLoaders,
    };

    if (order === undefined) {
      this.placeholders.push(placeholder);
      return;
    }

    this.placeholders.splice(this.findPosition(order), 0, placeholder);
  }

  private findPosition(order: number) {
    const position = this.placeholders.findIndex(placeholder => placeholder.order === undefined || order <= placeholder.order);

    if (position === -1) {
      return this.placeholders.length;
    }

    return position;
  }
}
