/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IDatabaseDataDocument {
  $type: 'document';
  id: string;
  contentType: string;
  properties: Record<string, any>;
  data: string;
}
