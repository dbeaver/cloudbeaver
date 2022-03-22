/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DND_ELEMENT_TYPE } from './DND_ELEMENT_TYPE';
import type { DND_NATIVE_TYPE } from './DND_NATIVE_TYPE';

type AcceptType = typeof DND_NATIVE_TYPE | typeof DND_ELEMENT_TYPE;

export type DNDAcceptType = AcceptType | AcceptType[];