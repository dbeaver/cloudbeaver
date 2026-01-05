/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IFormatRule, IFormatRuleParameter } from './IFormatRule.js';

export const FONT_WEIGHT_PARAMETER: IFormatRuleParameter = {
  name: 'plugin_data_viewer_conditional_formatting_parameter_font_weight',
  key: 'font-weight',
  type: 'boolean',
  default: false,
};

export const FONT_STYLE_PARAMETER: IFormatRuleParameter = {
  name: 'plugin_data_viewer_conditional_formatting_parameter_font_style',
  key: 'font-style',
  type: 'boolean',
  default: false,
};

export const TEXT_DECORATION_PARAMETER: IFormatRuleParameter = {
  name: 'plugin_data_viewer_conditional_formatting_parameter_text_decoration',
  key: 'text-decoration',
  type: 'select',
  default: 'none',
  options: [
    { value: 'none', label: 'plugin_data_viewer_conditional_formatting_parameter_text_decoration_none' },
    { value: 'line-through', label: 'plugin_data_viewer_conditional_formatting_parameter_text_decoration_line_through' },
    { value: 'underline', label: 'plugin_data_viewer_conditional_formatting_parameter_text_decoration_underline' },
    { value: 'overline', label: 'plugin_data_viewer_conditional_formatting_parameter_text_decoration_overline' },
  ],
};

export const TEXT_COLOR_PARAMETER: IFormatRuleParameter = {
  name: 'plugin_data_viewer_conditional_formatting_parameter_text_color',
  key: 'text-color',
  type: 'color',
  default: '#000000',
};

export const BACKGROUND_COLOR_PARAMETER: IFormatRuleParameter = {
  name: 'plugin_data_viewer_conditional_formatting_parameter_background_color',
  key: 'background-color',
  type: 'color',
  default: '#57bb8a',
};

export const VALUE_PARAMETER: IFormatRuleParameter = {
  name: 'plugin_data_viewer_conditional_formatting_parameter_value',
  key: 'value',
  type: 'string',
};

export const DEFAULT_FORMAT_RULES: IFormatRule[] = [
  {
    id: 'is-empty',
    name: 'plugin_data_viewer_conditional_formatting_rule_is_empty',
    formatting: {
      ['text-color']: TEXT_COLOR_PARAMETER,
      ['background-color']: BACKGROUND_COLOR_PARAMETER,
      ['font-weight']: FONT_WEIGHT_PARAMETER,
      ['font-style']: FONT_STYLE_PARAMETER,
      ['text-decoration']: TEXT_DECORATION_PARAMETER,
    },
    match: ({ text }) => text === null || text === undefined || text === '',
  },
  {
    id: 'is-not-empty',
    name: 'plugin_data_viewer_conditional_formatting_rule_is_not_empty',
    formatting: {
      ['text-color']: TEXT_COLOR_PARAMETER,
      ['background-color']: BACKGROUND_COLOR_PARAMETER,
      ['font-weight']: FONT_WEIGHT_PARAMETER,
      ['font-style']: FONT_STYLE_PARAMETER,
      ['text-decoration']: TEXT_DECORATION_PARAMETER,
    },
    match: ({ text }) => text !== null && text !== undefined && text !== '',
  },
  {
    id: 'text-contains',
    name: 'plugin_data_viewer_conditional_formatting_rule_text_contains',
    getName: (t, parameters) => `${t('plugin_data_viewer_conditional_formatting_rule_text_contains')} "${parameters['value']}"`,
    parameters: {
      value: VALUE_PARAMETER,
    },
    formatting: {
      ['text-color']: TEXT_COLOR_PARAMETER,
      ['background-color']: BACKGROUND_COLOR_PARAMETER,
      ['font-weight']: FONT_WEIGHT_PARAMETER,
      ['font-style']: FONT_STYLE_PARAMETER,
      ['text-decoration']: TEXT_DECORATION_PARAMETER,
    },
    match: ({ text }, { value: pattern }) =>
      typeof text === 'string' && typeof pattern === 'string' && pattern.length > 0 && text.toLowerCase().includes(pattern.toLowerCase()),
  },
  {
    id: 'text-does-not-contain',
    name: 'plugin_data_viewer_conditional_formatting_rule_text_does_not_contain',
    getName: (t, parameters) => `${t('plugin_data_viewer_conditional_formatting_rule_text_does_not_contain')} "${parameters['value']}"`,
    parameters: {
      value: VALUE_PARAMETER,
    },
    formatting: {
      ['text-color']: TEXT_COLOR_PARAMETER,
      ['background-color']: BACKGROUND_COLOR_PARAMETER,
      ['font-weight']: FONT_WEIGHT_PARAMETER,
      ['font-style']: FONT_STYLE_PARAMETER,
      ['text-decoration']: TEXT_DECORATION_PARAMETER,
    },
    match: ({ text }, { value: pattern }) =>
      typeof text === 'string' && typeof pattern === 'string' && pattern.length > 0 && !text.toLowerCase().includes(pattern.toLowerCase()),
  },
  {
    id: 'text-starts-with',
    name: 'plugin_data_viewer_conditional_formatting_rule_text_starts_with',
    getName: (t, parameters) => `${t('plugin_data_viewer_conditional_formatting_rule_text_starts_with')} "${parameters['value']}"`,
    parameters: {
      value: VALUE_PARAMETER,
    },
    formatting: {
      ['text-color']: TEXT_COLOR_PARAMETER,
      ['background-color']: BACKGROUND_COLOR_PARAMETER,
      ['font-weight']: FONT_WEIGHT_PARAMETER,
      ['font-style']: FONT_STYLE_PARAMETER,
      ['text-decoration']: TEXT_DECORATION_PARAMETER,
    },
    match: ({ text }, { value: pattern }) =>
      typeof text === 'string' && typeof pattern === 'string' && pattern.length > 0 && text.toLowerCase().startsWith(pattern.toLowerCase()),
  },
  {
    id: 'text-ends-with',
    name: 'plugin_data_viewer_conditional_formatting_rule_text_ends_with',
    getName: (t, parameters) => `${t('plugin_data_viewer_conditional_formatting_rule_text_ends_with')} "${parameters['value']}"`,
    parameters: {
      value: VALUE_PARAMETER,
    },
    formatting: {
      ['text-color']: TEXT_COLOR_PARAMETER,
      ['background-color']: BACKGROUND_COLOR_PARAMETER,
      ['font-weight']: FONT_WEIGHT_PARAMETER,
      ['font-style']: FONT_STYLE_PARAMETER,
      ['text-decoration']: TEXT_DECORATION_PARAMETER,
    },
    match: ({ text }, { value: pattern }) =>
      typeof text === 'string' && typeof pattern === 'string' && pattern.length > 0 && text.toLowerCase().endsWith(pattern.toLowerCase()),
  },
  {
    id: 'text-is-exactly',
    name: 'plugin_data_viewer_conditional_formatting_rule_text_is_exactly',
    getName: (t, parameters) => `${t('plugin_data_viewer_conditional_formatting_rule_text_is_exactly')} "${parameters['value']}"`,
    parameters: {
      value: VALUE_PARAMETER,
    },
    formatting: {
      ['text-color']: TEXT_COLOR_PARAMETER,
      ['background-color']: BACKGROUND_COLOR_PARAMETER,
      ['font-weight']: FONT_WEIGHT_PARAMETER,
      ['font-style']: FONT_STYLE_PARAMETER,
      ['text-decoration']: TEXT_DECORATION_PARAMETER,
    },
    match: ({ text }, { value: pattern }) => typeof text === 'string' && typeof pattern === 'string' && text.toLowerCase() === pattern.toLowerCase(),
  },
];

export const COLOR_SCALE_RULE: IFormatRule = {
  id: 'color-scale',
  name: 'plugin_data_viewer_conditional_formatting_rule_color_scale',
  parameters: {
    ['min-type']: {
      name: 'plugin_data_viewer_conditional_formatting_parameter_minpoint',
      key: 'min-type',
      type: 'select',
      default: 'min-value',
      options: [
        { label: 'plugin_data_viewer_conditional_formatting_parameter_min_value', value: 'min-value' },
        { label: 'plugin_data_viewer_conditional_formatting_parameter_number', value: 'number' },
        { label: 'plugin_data_viewer_conditional_formatting_parameter_percent', value: 'percent' },
        { label: 'plugin_data_viewer_conditional_formatting_parameter_percentile', value: 'percentile' },
      ],
    },
    ['min-value']: {
      ...VALUE_PARAMETER,
      key: 'min-value',
    },

    ['mid-type']: {
      name: 'plugin_data_viewer_conditional_formatting_parameter_midpoint',
      key: 'mid-type',
      type: 'select',
      default: 'none',
      options: [
        { label: 'plugin_data_viewer_conditional_formatting_parameter_none', value: 'none' },
        { label: 'plugin_data_viewer_conditional_formatting_parameter_number', value: 'number' },
        { label: 'plugin_data_viewer_conditional_formatting_parameter_percent', value: 'percent' },
        { label: 'plugin_data_viewer_conditional_formatting_parameter_percentile', value: 'percentile' },
      ],
    },
    ['mid-value']: {
      ...VALUE_PARAMETER,
      key: 'mid-value',
    },

    ['max-type']: {
      name: 'plugin_data_viewer_conditional_formatting_parameter_maxpoint',
      key: 'max-type',
      type: 'select',
      default: 'max-value',
      options: [
        { label: 'plugin_data_viewer_conditional_formatting_parameter_max_value', value: 'max-value' },
        { label: 'plugin_data_viewer_conditional_formatting_parameter_number', value: 'number' },
        { label: 'plugin_data_viewer_conditional_formatting_parameter_percent', value: 'percent' },
        { label: 'plugin_data_viewer_conditional_formatting_parameter_percentile', value: 'percentile' },
      ],
    },
    ['max-value']: {
      ...VALUE_PARAMETER,
      key: 'max-value',
    },
  },
  formatting: {
    ['min-color']: {
      ...BACKGROUND_COLOR_PARAMETER,
      key: 'min-color',
      default: undefined,
    },
    ['mid-color']: {
      ...BACKGROUND_COLOR_PARAMETER,
      key: 'mid-color',
      default: undefined,
    },
    ['max-color']: {
      ...BACKGROUND_COLOR_PARAMETER,
      key: 'max-color',
    },
  },
  match: () => 0,
};
