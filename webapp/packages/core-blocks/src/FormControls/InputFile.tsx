/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { ReactNode, useCallback, useContext, useState } from 'react';
import styled, { css, use } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { blobToData, bytesToSize } from '@cloudbeaver/core-utils';

import { Button } from '../Button';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { IconButton } from '../IconButton';
import { useTranslate } from '../localization/useTranslate';
import { UploadArea } from '../UploadArea';
import { useStyles } from '../useStyles';
import { baseFormControlStyles, baseInvalidFormControlStyles, baseValidFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';

const DEFAULT_MAX_FILE_SIZE = 2048;

const INPUT_FILE_FIELD_STYLES = css`
  field-label {
    display: block;
    composes: theme-typography--body1 from global;
    font-weight: 500;
  }
  field-label:not(:empty) {
    padding-bottom: 10px;
  }
  field-description {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  IconButton {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    cursor: pointer;
    &:hover {
      opacity: 0.5;
    }
  }
`;

interface Props<TState> extends ILayoutSizeProps {
  name: keyof TState;
  state: TState;
  labelTooltip?: string;
  tooltip?: string;
  required?: boolean;
  style?: ComponentStyle;
  /** Max file size in KB */
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  onChange?: (value: string, name: keyof TState) => void;
}

type InputFileType = <TState extends Record<string, any>>(props: Props<TState>) => React.ReactElement<any, any>;

export const InputFile: InputFileType = observer(function InputFile({
  name,
  state,
  labelTooltip,
  tooltip,
  required,
  small,
  medium,
  large,
  tiny,
  style,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  disabled,
  className,
  children,
  onChange,
}: Props<Record<any, any>>) {
  const translate = useTranslate();
  const context = useContext(FormContext);

  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState<Error | null>(null);


  const styles = useStyles(
    INPUT_FILE_FIELD_STYLES,
    baseFormControlStyles,
    style,
    error ? baseInvalidFormControlStyles : baseValidFormControlStyles
  );

  const description = error?.message ?? selected?.name ?? translate('ui_no_file_chosen');

  const removeFile = useCallback(() => {
    setSelected(null);

    if (state[name]) {
      const value = '';
      state[name] = value;
      onChange?.(value, name);
      context?.change(value, name);
    }
  }, [name, state, context, onChange]);

  const validateFileSize = useCallback((size: number) => {
    const maxFileSizeBytes = maxFileSize * 1000;

    if (size > maxFileSizeBytes) {
      throw new Error(translate('ui_file_size_exceeds', undefined, {
        size: bytesToSize(size),
        maxSize: bytesToSize(maxFileSizeBytes),
      }));
    }
  }, [maxFileSize]);

  const handleChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setError(null);

    if (!file) {
      removeFile();
    } else {
      try {
        validateFileSize(file.size);

        const value = await blobToData(file);

        if (value) {
          setSelected(file);
          state[name] = value;
          onChange?.(value, name);
          context?.change(value, name);
        }
      } catch (exception: any) {
        removeFile();
        setError(exception);
      }
    }
  }, [name, state, context, validateFileSize, removeFile, onChange]);

  return styled(styles)(
    <field className={className} {...use({ small, medium, large, tiny })}>
      <field-label title={labelTooltip}>{children}{required && ' *'}</field-label>
      <UploadArea title={tooltip} disabled={disabled} accept='.zip,.rar,.7zip' reset onChange={handleChange}>
        <Button
          icon='/icons/import.svg'
          tag='div'
          mod={['outlined']}
          disabled={disabled}
        >
          {translate('ui_upload_file')}
        </Button>
      </UploadArea>
      <field-description>
        {description}
        {selected && <IconButton disabled={disabled} name='cross' onClick={removeFile} />}
      </field-description>
    </field>
  );
});