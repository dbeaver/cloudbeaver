/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { uuid } from '@dbeaver/core/utils';

export type PlaceholderProps<T = unknown> = {
  context: T;
}

export type PlaceholderComponent<T = unknown> = React.FunctionComponent<PlaceholderProps<T>>

export type PlaceholderElement<T = unknown> = {
  id: string;
  component: PlaceholderComponent<T>;
  order?: number;
}

export class PlaceholderContainer<T = unknown> {
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

    if (!order) {
      this.placeholders.push(placeholder);
    } else {
      const position = this.findPosition(order);
      console.log(position);
      this.placeholders.splice(position, 0, placeholder);
    }
  }

  private findPosition(order: number) {
    for (let i = 0; i < this.placeholders.length; i++) {
      const placeholder = this.placeholders[i];
      if (placeholder.order === undefined || order <= placeholder.order) {
        return i;
      }
    }

    return this.placeholders.length;
  }
}
