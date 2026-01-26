/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IKeyBinding {
  id: string;
  preventDefault?: boolean;
  // use keys if it applied for all OS. otherwise use all OS specific keys to define shortcuts
  keys?: string | string[];
  keysWin?: string | string[];
  keysMac?: string | string[];
  keysLinux?: string | string[];
}
