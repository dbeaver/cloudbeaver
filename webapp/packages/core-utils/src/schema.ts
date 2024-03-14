import * as z from 'zod';

export const schemaExtra = {
  stringedBoolean() {
    return z.union([z.enum(['false', '0']).transform(() => false), z.boolean(), z.string(), z.number()]).pipe(z.coerce.boolean());
  },
};
export { z as schema };
