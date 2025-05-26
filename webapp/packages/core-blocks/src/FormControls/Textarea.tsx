/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useLayoutEffect, useRef } from 'react';

import { getTextFileReadingProcess } from '@cloudbeaver/core-utils';

import { Button } from '../Button.js';
import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { UploadArea } from '../UploadArea.js';
import { useCombinedHandler } from '../useCombinedHandler.js';
import { useS } from '../useS.js';
import { Field } from './Field.js';
import { FieldDescription } from './FieldDescription.js';
import { FieldLabel } from './FieldLabel.js';
import { FormContext } from './FormContext.js';
import textareaStyle from './Textarea.module.css';

type BaseProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'style'> &
  ILayoutSizeProps & {
    description?: string;
    labelTooltip?: string;
    embedded?: boolean;
    cursorInitiallyAtEnd?: boolean;
    uploadable?: boolean;
  };

type ControlledProps = BaseProps & {
  name?: string;
  value?: string;
  onChange?: (value: string, name?: string) => any;
  state?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?: (value: string, name: TKey) => any;
  value?: never;
};

interface TextareaType {
  (props: ControlledProps): React.JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): React.JSX.Element;
}

export const Textarea: TextareaType = observer(function Textarea({
  name,
  value: controlledValue,
  state,
  required,
  children,
  className,
  description,
  labelTooltip,
  embedded,
  cursorInitiallyAtEnd,
  uploadable,
  onKeyDown,
  onChange = () => {},
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const translate = useTranslate();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);
  const styles = useS(textareaStyle);
  const context = useContext(FormContext);
  const handleKeyDown = useCombinedHandler(onKeyDown, context?.keyDown);

  const handleChange = useCallback(
    (value: string) => {
      if (state) {
        state[name] = value;
      }
      if (onChange) {
        onChange(value, name);
      }
      if (context) {
        context.change(value, name);
      }
    },
    [state, name, onChange],
  );

  const value = state ? state[name] : controlledValue;

  useLayoutEffect(() => {
    if (cursorInitiallyAtEnd && typeof value === 'string') {
      const position = value.length;
      textareaRef.current?.setSelectionRange(position, position);
    }
  }, [cursorInitiallyAtEnd]);

  return (
    <Field {...layoutProps} className={s(styles, { field: true, embedded }, className)}>
      <FieldLabel className={s(styles, { fieldLabel: true })} title={labelTooltip || rest.title} required={required}>
        {children}
      </FieldLabel>
      <textarea
        {...rest}
        ref={textareaRef}
        required={required}
        className={s(styles, { textarea: true })}
        value={value ?? ''}
        name={name}
        data-embedded={embedded}
        onKeyDown={handleKeyDown}
        onChange={event => handleChange(event.target.value)}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {uploadable && (
        <UploadArea
          className={s(styles, { uploadButton: true })}
          disabled={rest.disabled || rest.readOnly}
          reset
          onChange={async event => {
            const file = event.target.files?.[0];

            if (!file) {
              throw new Error('File is not found');
            }

            const process = getTextFileReadingProcess(file);
            const value = await process.promise;

            if (value) {
              handleChange(value);
            }
          }}
        >
          <Button className="tw:inline-flex" tag="div" disabled={rest.disabled || rest.readOnly} variant="secondary">
            {translate('ui_file')}
          </Button>
        </UploadArea>
      )}
    </Field>
  );
});
