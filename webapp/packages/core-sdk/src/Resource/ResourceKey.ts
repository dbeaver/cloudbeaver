/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResourceKeyAlias } from './ResourceKeyAlias';
import type { ResourceKeyList } from './ResourceKeyList';
import type { ResourceKeyListAlias } from './ResourceKeyListAlias';

export type ResourceKey<TKey> = ResourceKeyList<TKey> | ResourceKeyFlat<TKey>;
export type ResourceKeyFlat<TKey> = TKey | ResourceKeyAlias<TKey, any> | ResourceKeyListAlias<TKey, any>;
export type ResourceKeySimple<TKey> = TKey | ResourceKeyList<TKey>;
export type ResourceKeyType<TKey> = TKey extends ResourceKeyList<infer I> ? I : TKey;