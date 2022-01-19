/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExtension } from './IExtension';

interface ExtensionExecutor {
  on: <T extends IExtension<any>>(
    predicate: (extension: IExtension<any>) => extension is T,
    action: (extension: T) => void
  ) => this;
  has: <T extends IExtension<any>> (isProvider: (extension: IExtension<any>) => extension is T) => boolean;
}

export const ExtensionUtils = {
  from(extensions: Array<IExtension<any>>): ExtensionExecutor {
    return {
      on<T extends IExtension<any>>(
        predicate: (extension: IExtension<any>) => extension is T,
        action: (extension: T) => void
      ) {
        for (const extension of extensions) {
          if (predicate(extension)) {
            action(extension);
          }
        }
        return this;
      },
      has<T extends IExtension<any>>(isProvider: (extension: IExtension<any>) => extension is T): boolean {
        return extensions.some(isProvider);
      },
    };
  },
};
