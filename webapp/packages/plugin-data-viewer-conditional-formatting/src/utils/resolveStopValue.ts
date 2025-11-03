/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { getValueForRuleParameter } from '../formatting/getValueForRuleParameter.js';
import type { IFormatRule } from '../formatting/IFormatRule.js';
import type { IFormatRuleState } from '../formatting/IFormatRuleState.js';
import { getPercentile } from './getPercentile.js';

export function resolveStopValue(
  rule: IFormatRule,
  state: IFormatRuleState,
  kind: 'mid' | 'min' | 'max',
  dataMin: number,
  dataMax: number,
  sorted: number[],
): number | null {
  const type = getValueForRuleParameter<'none' | 'min-value' | 'max-value' | 'number' | 'percent' | 'percentile'>(
    state.parameters,
    rule.parameters,
    `${kind}-type`,
  );

  if (type === 'min-value') {
    return dataMin;
  }

  if (type === 'max-value') {
    return dataMax;
  }

  if (type === 'none') {
    return null;
  }

  const value = parseFloat(getValueForRuleParameter<string>(state.parameters, rule.parameters, `${kind}-value`, '0'));
  if (type === 'number') {
    return value;
  }
  if (type === 'percent') {
    return dataMin + (value / 100) * (dataMax - dataMin);
  }
  return getPercentile(sorted, value / 100);
}
