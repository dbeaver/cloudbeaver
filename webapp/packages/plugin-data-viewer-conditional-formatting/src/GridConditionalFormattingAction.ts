/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { injectable } from '@cloudbeaver/core-di';
import {
  DatabaseDataAction,
  GridDataKeysUtils,
  GridViewAction,
  IDatabaseDataFormatAction,
  IDatabaseDataMetadataAction,
  IDatabaseDataResult,
  IDatabaseDataSource,
  IDatabaseDataViewAction,
  type IGridDataKey,
} from '@cloudbeaver/plugin-data-viewer';
import type { IFormatRuleState } from './formatting/IFormatRuleState.js';
import { makeObservable, observable } from 'mobx';
import { COLOR_SCALE_RULE, DEFAULT_FORMAT_RULES } from './formatting/DEFAULT_FORMAT_RULES.js';
import type { ICellFormatting } from './formatting/ICellFormatting.js';
import { getValueForRuleParameter } from './formatting/getValueForRuleParameter.js';
import { ALL_COLUMNS } from './formatting/ALL_COLUMNS.js';
import type { IFormatRuleMatchValueGetter } from './formatting/IFormatRule.js';
import { getColorMix } from './utils/getColorMix.js';
import { uuid } from '@cloudbeaver/core-utils';
import { getSurfaceColor } from './getSurfaceColor.js';
import { ThemeService } from '@cloudbeaver/core-theming';
import { normalize } from './utils/normalize.js';
import { resolveStopValue } from './utils/resolveStopValue.js';
import { clamp } from './utils/clamp.js';

@injectable(() => [
  IDatabaseDataSource,
  IDatabaseDataResult,
  IDatabaseDataViewAction,
  IDatabaseDataFormatAction,
  IDatabaseDataMetadataAction,
  ThemeService,
])
export class GridConditionalFormattingAction<
  TColumn = unknown,
  TRow = unknown,
  TKey extends IGridDataKey = IGridDataKey,
  TCell = unknown,
  TResult extends IDatabaseDataResult = IDatabaseDataResult,
> extends DatabaseDataAction<any, TResult> {
  static dataFormat: ResultDataFormat[] | null = null;

  get rules(): IFormatRuleState[] {
    return this.metadata.get('conditional-formatting-rules', () => observable([]));
  }

  protected readonly view: GridViewAction<TColumn, TRow, TKey, TCell, TResult>;
  protected readonly format: IDatabaseDataFormatAction<TKey, TResult>;

  private readonly sortedValueCache: Map<string, number[]>;

  constructor(
    source: IDatabaseDataSource<any, TResult>,
    result: TResult,
    view: IDatabaseDataViewAction<TKey, TCell, TResult>,
    format: IDatabaseDataFormatAction<TKey, TResult>,
    private readonly metadata: IDatabaseDataMetadataAction,
    private readonly themeService: ThemeService,
  ) {
    super(source, result);
    this.view = view as GridViewAction<TColumn, TRow, TKey, TCell, TResult>;
    this.format = format;
    this.sortedValueCache = new Map();

    makeObservable<this, 'sortedValueCache'>(this, {
      sortedValueCache: observable.shallow,
    });
  }

  createRule(): IFormatRuleState {
    const rule: IFormatRuleState = observable({
      id: uuid(),
      ruleId: DEFAULT_FORMAT_RULES[0]!.id,
      type: 'single',
      parameters: observable({}),
    });
    this.rules.push(rule);
    return rule;
  }

  deleteRule(id: string): void {
    const index = this.rules.findIndex(rule => rule.id === id);
    if (index >= 0) {
      this.rules.splice(index, 1);
    }
  }

  getFormatting(key: TKey): ICellFormatting | null {
    const format = this.format;
    const holder = format.get(key);
    const valueGetter: IFormatRuleMatchValueGetter = {
      get text() {
        return format.getText(holder);
      },
      get number() {
        return format.getNumber(holder);
      },
    };

    const formatting: ICellFormatting = {};
    let formatted = false;
    for (const rule of this.rules) {
      if (rule.column && !GridDataKeysUtils.isEqual(rule.column, ALL_COLUMNS.key) && !GridDataKeysUtils.isEqual(rule.column, key.column)) {
        continue;
      }

      const ruleData = rule.type === 'scale' ? COLOR_SCALE_RULE : DEFAULT_FORMAT_RULES.find(r => r.id === rule.ruleId);
      if (!ruleData) {
        continue;
      }

      if (rule.type === 'single') {
        if (ruleData.match(valueGetter, rule.parameters)) {
          formatting.color = getValueForRuleParameter<string>(rule.parameters, ruleData.formatting, 'text-color');
          formatting.backgroundColor = getValueForRuleParameter<string>(rule.parameters, ruleData.formatting, 'background-color');
          formatting.fontStyle = getValueForRuleParameter<boolean>(rule.parameters, ruleData.formatting, 'font-style') ? 'italic' : undefined;
          formatting.fontWeight = getValueForRuleParameter<boolean>(rule.parameters, ruleData.formatting, 'font-weight') ? 'bold' : undefined;
          const textDecoration = getValueForRuleParameter<'none' | 'underline' | 'overline' | 'line-through'>(
            rule.parameters,
            ruleData.formatting,
            'text-decoration',
          );
          formatting.textDecoration = Array.isArray(textDecoration) ? textDecoration.join(' ') : textDecoration;
          formatted = true;
        }
      } else if (this.format.isNumber(holder)) {
        const cellValue = valueGetter.number;
        if (isNaN(cellValue)) {
          continue;
        }

        const sortedValues = this.getSortedValuesCache(key);
        const dataMin = sortedValues[0] ?? 0;
        const dataMax = sortedValues[sortedValues.length - 1] ?? 0;

        const minValue = resolveStopValue(ruleData, rule, 'min', dataMin, dataMax, sortedValues)!;
        const maxValue = resolveStopValue(ruleData, rule, 'max', dataMin, dataMax, sortedValues)!;
        const midValue = resolveStopValue(ruleData, rule, 'mid', dataMin, dataMax, sortedValues);

        const themeType = this.themeService.currentTheme?.type;
        const minColor = getValueForRuleParameter<string>(rule.parameters, ruleData.formatting, 'min-color', getSurfaceColor(themeType));
        const maxColor = getValueForRuleParameter<string>(rule.parameters, ruleData.formatting, 'max-color', '#00FF00');

        if (midValue === null) {
          const ratio = normalize(cellValue, minValue, maxValue);
          formatting.backgroundColor = getColorMix(minColor, maxColor, ratio);
          formatted = true;
        } else {
          const midColor = getValueForRuleParameter<string>(rule.parameters, ruleData.formatting, 'mid-color', '#FFFF00');
          const midV = clamp(midValue, minValue, maxValue);

          if (cellValue <= minValue) {
            formatting.backgroundColor = minColor;
            formatted = true;
          } else if (cellValue >= maxValue) {
            formatting.backgroundColor = maxColor;
            formatted = true;
          } else if (cellValue <= midV) {
            const t = normalize(cellValue, minValue, midV);
            formatting.backgroundColor = getColorMix(minColor, midColor, t);
            formatted = true;
          } else {
            const t = normalize(cellValue, midV, maxValue);
            formatting.backgroundColor = getColorMix(midColor, maxColor, t);
            formatted = true;
          }
        }
      }
    }

    // do not use Object.keys() it's slow
    return formatted ? formatting : null;
  }

  private getSortedValuesCache(key: TKey): number[] {
    const cacheKey = GridDataKeysUtils.serializeElementKey(key);
    let cached = this.sortedValueCache.get(cacheKey);
    if (!cached) {
      cached = this.view.rowKeys
        .map(row => this.format.getNumber(this.format.get({ row, column: key.column } as TKey)))
        .filter(v => !isNaN(v))
        .sort((a, b) => a - b);
      this.sortedValueCache.set(cacheKey, cached);
    }
    return cached;
  }

  override updateResult(result: TResult, index: number): void {
    super.updateResult(result, index);
    this.sortedValueCache.clear();
  }
}
