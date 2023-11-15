/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ITaskDescriptor {
  id: string;
  name: string;
  getMessage: () => string;
  getProgress?: () => number;

  fulfilled: boolean;
  exception?: Error;
  task: Promise<any>;
}

export type ITaskDescriptorOptions = Omit<ITaskDescriptor, 'id' | 'fulfilled' | 'exception'>;
