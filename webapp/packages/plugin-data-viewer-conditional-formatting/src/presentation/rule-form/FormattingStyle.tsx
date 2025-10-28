/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import {
  BACKGROUND_COLOR_PARAMETER,
  FONT_STYLE_PARAMETER,
  FONT_WEIGHT_PARAMETER,
  TEXT_COLOR_PARAMETER,
  TEXT_DECORATION_PARAMETER,
} from '../../formatting/DEFAULT_FORMAT_RULES.js';
import { getValueForRuleParameter } from '../../formatting/getValueForRuleParameter.js';
import type { IFormatRule } from '../../formatting/IFormatRule.js';
import type { IFormatRuleState } from '../../formatting/IFormatRuleState.js';
import { ColorPicker, IconButton } from '@dbeaver/ui-kit';
import { useTranslate } from '@cloudbeaver/core-blocks';
import { ColorScalePreview } from '../ColorScalePreview.js';

interface Props {
  rule: IFormatRule;
  state: IFormatRuleState;
}

export const FormattingStyle = observer<Props>(function FormattingStyle({ rule, state }) {
  const t = useTranslate();
  const findFormat = (key: string) => rule.formatting?.[key];
  const colorParameter = findFormat(TEXT_COLOR_PARAMETER.key);
  const backgroundColorParameter = findFormat(BACKGROUND_COLOR_PARAMETER.key);
  const fontWeightParameter = findFormat(FONT_WEIGHT_PARAMETER.key);
  const fontStyleParameter = findFormat(FONT_STYLE_PARAMETER.key);
  const textDecorationParameter = findFormat(TEXT_DECORATION_PARAMETER.key);

  const color = getValueForRuleParameter<string>(state.parameters, rule.parameters, TEXT_COLOR_PARAMETER.key, 'inherit');
  const backgroundColor = getValueForRuleParameter<string>(state.parameters, rule.parameters, BACKGROUND_COLOR_PARAMETER.key, 'transparent');
  const fontWeight = getValueForRuleParameter<boolean>(state.parameters, rule.parameters, FONT_WEIGHT_PARAMETER.key);
  const fontStyle = getValueForRuleParameter<boolean>(state.parameters, rule.parameters, FONT_STYLE_PARAMETER.key);
  const textDecoration = getValueForRuleParameter<string | string[]>(state.parameters, rule.parameters, TEXT_DECORATION_PARAMETER.key);

  function toggleFontWeight() {
    if (fontWeight) {
      state.parameters[FONT_WEIGHT_PARAMETER.key] = false;
    } else {
      state.parameters[FONT_WEIGHT_PARAMETER.key] = true;
    }
  }

  function toggleFontStyle() {
    if (fontStyle) {
      state.parameters[FONT_STYLE_PARAMETER.key] = false;
    } else {
      state.parameters[FONT_STYLE_PARAMETER.key] = true;
    }
  }

  const isTextDecorationMulti = Array.isArray(textDecoration);
  const isUnderlineActive = isTextDecorationMulti ? textDecoration.includes('underline') : textDecoration === 'underline';
  const isStrikethroughActive = isTextDecorationMulti ? textDecoration.includes('line-through') : textDecoration === 'line-through';

  function toggleUnderline() {
    if (isUnderlineActive) {
      state.parameters[TEXT_DECORATION_PARAMETER.key] = removeCssValue(textDecoration!, 'underline');
    } else {
      state.parameters[TEXT_DECORATION_PARAMETER.key] = joinCssValue(textDecoration!, 'underline');
    }
  }

  function toggleStrikethrough() {
    if (isStrikethroughActive) {
      state.parameters[TEXT_DECORATION_PARAMETER.key] = removeCssValue(textDecoration!, 'line-through');
    } else {
      state.parameters[TEXT_DECORATION_PARAMETER.key] = joinCssValue(textDecoration!, 'line-through');
    }
  }

  return (
    <div className="tw:border theme-border-color-background tw:flex tw:flex-col tw:rounded-(--theme-form-element-radius) tw:overflow-hidden tw:max-w-md">
      <ColorScalePreview
        color={color}
        leftColor={backgroundColor}
        rightColor={backgroundColor}
        fontStyle={fontStyle ? 'italic' : 'normal'}
        fontWeight={fontWeight ? 'bold' : 'normal'}
        textDecoration={textDecoration}
        className="tw:border-none! tw:rounded-none!"
      >
        Default
      </ColorScalePreview>
      <div className="tw:p-0.5 tw:gap-0.5 tw:flex tw:border-t theme-border-color-background">
        {fontWeightParameter && (
          <IconButton aria-label={t('Bold')} style={{ fontWeight: 'bold' }} data-active={fontWeight} size="small" onClick={toggleFontWeight}>
            B
          </IconButton>
        )}
        {fontStyleParameter && (
          <IconButton aria-label={t('Italic')} style={{ fontStyle: 'italic' }} data-active={fontStyle} size="small" onClick={toggleFontStyle}>
            I
          </IconButton>
        )}
        {textDecorationParameter && (
          <>
            <IconButton
              aria-label={t('Underline')}
              style={{ textDecoration: 'underline' }}
              data-active={isUnderlineActive}
              size="small"
              onClick={toggleUnderline}
            >
              U
            </IconButton>
            <IconButton
              aria-label={t('Strikethrough')}
              style={{ textDecoration: 'line-through' }}
              data-active={isStrikethroughActive}
              size="small"
              onClick={toggleStrikethrough}
            >
              S
            </IconButton>
          </>
        )}
        {colorParameter && (
          <ColorPicker
            variant="text"
            name={colorParameter.key}
            value={state.parameters[colorParameter.key] || '#000000'}
            defaultValue={colorParameter.default as string}
            size="small"
            onChange={color => (state.parameters[colorParameter.key] = color)}
          />
        )}

        {backgroundColorParameter && (
          <ColorPicker
            variant="background"
            name={backgroundColorParameter.key}
            value={state.parameters[backgroundColorParameter.key] || 'transparent'}
            defaultValue={backgroundColorParameter.default as string}
            size="small"
            onChange={color => (state.parameters[backgroundColorParameter.key] = color)}
          />
        )}
      </div>
    </div>
  );
});

function joinCssValue(value: string | string[], property: string): string | string[] {
  if (Array.isArray(value)) {
    return [...value, property];
  }

  if (value === 'none' || !value) {
    return property;
  }

  return [value, property];
}

function removeCssValue(value: string | string[], property: string): string | string[] {
  if (Array.isArray(value)) {
    const newValue = value.filter(v => v !== property);
    return newValue.length === 0 ? 'none' : newValue;
  }

  if (value === property) {
    return 'none';
  }

  return value;
}
