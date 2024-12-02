/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { RangeSet, RangeValue } from '@codemirror/state';

import type { IHyperlinkInfo } from './IHyperlinkInfo.js';

export const enum HyperlinkState {
  Inactive,
  Pending,
  Result,
}

export type HyperlinkSet = RangeSet<Hyperlink>;

export class Hyperlink extends RangeValue {
  hyperlink: IHyperlinkInfo | null;
  state: HyperlinkState;

  constructor() {
    super();
    this.hyperlink = null;
    this.state = HyperlinkState.Inactive;
  }

  static create() {
    return new Hyperlink();
  }

  static get none(): HyperlinkSet {
    return RangeSet.of<Hyperlink>([]);
  }
}
