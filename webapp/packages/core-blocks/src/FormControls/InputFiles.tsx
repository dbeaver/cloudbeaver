/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef, useContext, useEffect, useState } from 'react';
import styled, { use, css } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { useTranslate } from '../localization/useTranslate';
import { useStateDelay } from '../useStateDelay';
import { useRefInherit } from '../useRefInherit';
import { useStyles } from '../useStyles';
import { baseFormControlStyles, baseInvalidFormControlStyles, baseValidFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';
import { isControlPresented } from './isControlPresented';
import { UploadArea } from '../UploadArea';

import { Button, Tag, Tags, useCombinedHandler } from '..';

const INPUT_FIELD_STYLES = css`
    field-label {
      display: block;
      composes: theme-typography--body1 from global;
      font-weight: 500;
    }
    field-label:not(:empty) {
      padding-bottom: 10px;
    }
    input-container {
      position: relative;
    }
    Tags {
      padding-top: 8px;

      &:empty {
        display: none;
      }
    }
`;

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'name' | 'value' | 'style'> & ILayoutSizeProps & {
  error?: boolean;
  loading?: boolean;
  description?: string;
  labelTooltip?: string;
  mod?: 'surface';
  ref?: React.Ref<HTMLInputElement>;
  style?: ComponentStyle;
};

type ControlledProps = BaseProps & {
  name?: string;
  value?: FileList | null;
  onChange?: (value: FileList | null, name?: string) => any;
  state?: never;
  autoHide?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?: (value: TState[TKey], name: TKey) => any;
  autoHide?: boolean;
  value?: never;
};

interface InputFilesType {
  (props: ControlledProps): React.ReactElement<any, any> | null;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): React.ReactElement<any, any> | null;
}

export const InputFiles: InputFilesType = observer(forwardRef(function InputFiles({
  name,
  style,
  value: valueControlled,
  required,
  state,
  children,
  className,
  error,
  loading,
  description,
  labelTooltip,
  mod,
  fill,
  small,
  medium,
  large,
  tiny,
  autoHide,
  onChange,
  ...rest
}: ControlledProps | ObjectProps<any, any>, refInherit: React.Ref<HTMLInputElement>) {
  const ref = useRefInherit<HTMLInputElement>(refInherit);
  const [innerState, setInnerState] = useState<FileList | null>(null);
  const translate = useTranslate();
  const styles = useStyles(
    baseFormControlStyles,
    error ? baseInvalidFormControlStyles : baseValidFormControlStyles,
    INPUT_FIELD_STYLES,
    style
  );
  const context = useContext(FormContext);
  loading = useStateDelay(loading ?? false, 300);

  let value = valueControlled ?? innerState;

  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  function setValue(value: FileList | null) {
    setInnerState(value);
    if (state) {
      state[name] = value;
    }
    if (onChange) {
      onChange(value, name);
    }
    if (context) {
      context.change(value, name);
    }
  }

  const removeFile = useCombinedHandler(function removeFile(index: number): void {
    if (!value) {
      return;
    }

    const dt = new DataTransfer();

    for (let i = 0; i < value.length; i++) {
      const file = value[i];
      if (index !== i)
      {
        dt.items.add(file);
      }
    }

    setValue(dt.files.length === 0 ? null : dt.files);
  });

  const handleChange = useCombinedHandler((event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.files);
  });

  useEffect(() => {
    if (value !== innerState) {
      setInnerState(value);
    }
  });

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  const files = Array.from(value ?? []);

  return styled(styles)(
    <field className={className} {...use({ small, medium, large, tiny })}>
      <field-label title={labelTooltip || rest.title}>{children}{required && ' *'}</field-label>
      <input-container>
        <UploadArea
          ref={ref}
          {...rest}
          name={name}
          value={value}
          {...use({ mod })}
          required={required}
          onChange={handleChange}
        >
          <Button
            icon='/icons/import.svg'
            tag='div'
            loading={loading}
            mod={['outlined']}
          >
            {translate(rest.multiple ? 'ui_upload_files' : 'ui_upload_file')}
          </Button>
        </UploadArea>
        <Tags>
          {files.map((file, i) => (
            <Tag key={file.name} id={i} label={file.name} onRemove={removeFile} />
          ))}
        </Tags>
      </input-container>
      {description && (
        <field-description>
          {description}
        </field-description>
      )}
    </field>
  );
}));
