/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useDeferredValue, useId, useImperativeHandle, useRef, type ComponentPropsWithRef } from 'react';
import './ColorPicker.css';
import { Popover } from '../Popover/Popover.js';
import { ColorGrid } from './ColorGrid.js';
import { Button, ButtonIcon } from '../Button/Button.js';
import { ColorIndicator } from './ColorIndicator.js';
import { COLOR_PALETTE, type ColorInfo } from './colorPalette.js';
import { useColorPalette } from './useColorPalette.js';
import { IconButton } from '../IconButton/IconButton.js';
import { useTranslate } from '@dbeaver/react-translate';
import { Icon } from '../Icon/Icon.js';
import { normalizeColorToHex } from './colorUtils.js';

export type ColorPickerProps = Omit<ComponentPropsWithRef<'input'>, 'size' | 'value' | 'onChange' | 'type'> & {
  value: string;
  variant?: 'background' | 'text';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  palette?: ColorInfo[][];
  onChange?: (value: string | null) => void;
};

export const ColorPickerBase: React.FC<ColorPickerProps> = function ColorPicker({
  ref,
  value,
  variant,
  size,
  className,
  palette = COLOR_PALETTE,
  title,
  'aria-label': ariaLabel,
  style,
  onChange,
  ...props
}) {
  const t = useTranslate();
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const deferredValue = useDeferredValue(value);
  const colorPalette = useColorPalette(deferredValue, palette);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const handleColorSelect = useCallback((color: string) => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const hexColor = normalizeColorToHex(color);
    const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    nativeValueSetter?.call(input, hexColor);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedColor = event.target.value;
    onChange?.(selectedColor || null);
  }

  return (
    <Popover>
      <Popover.PopoverDisclosure
        render={
          <IconButton
            aria-labelledby={id}
            aria-label={ariaLabel ?? t('dbeaver_ui_kit_color_picker_select_color', 'Select color')}
            title={title}
            size={size}
            className={className}
            style={style}
            disabled={props.disabled}
          >
            {variant === 'text' ? 'A' : <Icon name="fill-color" />}
            <div className="tw:border-b-4 tw:absolute tw:bottom-0 tw:w-5/6" style={{ borderColor: deferredValue }} />
          </IconButton>
        }
      />
      <Popover.PopoverContent className="tw:p-(--dbv-kit-color-picker-padding) tw:flex tw:flex-col tw:gap-2" modal>
        <Button type="button" size="small" variant="secondary" className="tw:w-full tw:shrink-0" onClick={() => onChange?.(null)}>
          <ButtonIcon placement="start">
            <Icon name="no-color" />
          </ButtonIcon>
          {t('dbeaver_ui_kit_color_picker_none', 'None')}
        </Button>
        <ColorGrid colorPalette={colorPalette} onColorSelect={handleColorSelect} />

        <Button render={<label htmlFor={id} />} type="button" size="small" variant="secondary" className="tw:w-full tw:shrink-0">
          <ButtonIcon placement="start">
            <ColorIndicator color={deferredValue} isSelected={colorPalette.isCustomColor(deferredValue)} />
          </ButtonIcon>
          {t('dbeaver_ui_kit_color_picker_custom', 'Custom')}
        </Button>
        <input ref={inputRef} id={id} type="color" className="dbv-kit-color-picker" value={value} onChange={handleChange} {...props} />
      </Popover.PopoverContent>
    </Popover>
  );
};
