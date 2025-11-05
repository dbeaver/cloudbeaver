/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { TranslateFn } from '@cloudbeaver/core-localization';

type DefaultValueType = string | number | boolean;
export type FormatRuleValueType = DefaultValueType | DefaultValueType[];

export interface IFormatRuleParameterOption {
  label: string;
  value: string;
}

export interface IFormatRuleParameter {
  name: string;
  key: string;
  type: 'string' | 'number' | 'color' | 'boolean' | 'select';
  default?: FormatRuleValueType;
  options?: IFormatRuleParameterOption[];
}

export interface IFormatRuleMatchValueGetter {
  readonly text: string;
  readonly number: number;
}

export interface IFormatRule {
  id: string;
  name: string;
  getName?: (translate: TranslateFn, parameters: Record<string, unknown>) => string;
  match: (getValue: IFormatRuleMatchValueGetter, parameters: Record<string, unknown>) => boolean | number;
  parameters?: Record<string, IFormatRuleParameter>;
  formatting?: Record<string, IFormatRuleParameter>;
}
