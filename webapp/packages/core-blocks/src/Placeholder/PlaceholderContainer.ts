/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { uuid } from '@cloudbeaver/core-utils';

export type PlaceholderProps<T = unknown> = {
  context: T;
}

export type PlaceholderComponent<T = unknown> = React.FunctionComponent<PlaceholderProps<T>>

export type PlaceholderElement<T = unknown> = {
  id: string;
  component: PlaceholderComponent<T>;
  order?: number;
}

export class PlaceholderContainer<T = any> {
  private placeholders = observable<PlaceholderElement<T>>([], { deep: false });

  get() {
    return this.placeholders;
  }

  add(component: PlaceholderComponent<T>, order?: number) {
    const placeholder: PlaceholderElement<T> = {
      id: uuid(),
      component,
      order,
    };

    if (order === undefined) {
      this.placeholders.push(placeholder);
      return;
    }

    this.placeholders.splice(this.findPosition(order), 0, placeholder);
  }

  private findPosition(order: number) {
    const position = this.placeholders
      .findIndex(placeholder => placeholder.order === undefined || order <= placeholder.order);

    if (position === -1) {
      return this.placeholders.length;
    }

    return position;
  }
}
