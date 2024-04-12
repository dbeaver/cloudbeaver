/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import * as z from 'zod';

export const schemaExtra = {
  stringedBoolean() {
    return z.union([z.enum(['false', '0']).transform(() => false), z.boolean(), z.string(), z.number()]).pipe(z.coerce.boolean());
  },
};
export { z as schema };
