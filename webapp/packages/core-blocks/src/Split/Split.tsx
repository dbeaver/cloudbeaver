/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Split as BaseSplit, SplitProps } from 'go-split';

export type ISplitProps = SplitProps;

export function Split(props: ISplitProps) {
  return <BaseSplit {...props} />;
}
