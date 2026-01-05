/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { FormatRuleValueType, IFormatRuleParameter } from './IFormatRule.js';

export function getValueForRuleParameter<T extends FormatRuleValueType>(
  state: Record<string, any>,
  parameters: Record<string, IFormatRuleParameter> | undefined,
  key: string,
  fallback: T,
): T;
export function getValueForRuleParameter<T extends FormatRuleValueType>(
  state: Record<string, any>,
  parameters: Record<string, IFormatRuleParameter> | undefined,
  key: string,
): T | undefined;
export function getValueForRuleParameter<T extends FormatRuleValueType>(
  state: Record<string, any>,
  parameters: Record<string, IFormatRuleParameter> | undefined,
  key: string,
  fallback?: T,
): T | undefined {
  return state[key] ?? parameters?.[key]?.default ?? fallback;
}
