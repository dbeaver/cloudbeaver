/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ITabOptions<T = any> {
  id?: string;
  handlerId: string;
  handlerState: T;
}

export interface ITab<T = any> extends ITabOptions<T> {
  id: string;
  userId: string;
  restored: boolean;
}
