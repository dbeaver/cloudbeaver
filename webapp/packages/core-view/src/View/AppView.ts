/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IActiveView } from './IActiveView';
import { View } from './View';

export class AppView extends View<null> {
  getView(): IActiveView<null> {
    return {
      context: null,
      extensions: [],
    };
  }
}
