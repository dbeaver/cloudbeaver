/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IMenuContext<T> {
  menuId: string; // use this id to check where the menu is called
  data: T;

  // if the context is an instance of a class you don't need context type
  contextType?: string;
  // if is omitted the context menu id will be generated based on random uuid
  contextId?: string;
}
