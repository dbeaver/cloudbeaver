/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SplitProps, Split as BaseSplit } from 'go-split';

export function Split(props: SplitProps) {
  return <BaseSplit {...props}/>;
}
