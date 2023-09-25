/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { ReactNode, useContext, useState } from 'react';
import styled from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { blobToData, bytesToSize } from '@cloudbeaver/core-utils';

import { Button } from '../Button';
import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import elementsSizeStyles from '../Containers/shared/ElementsSize.m.css';
import { IconButton } from '../IconButton';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { UploadArea } from '../UploadArea';
import { useS } from '../useS';
import { useStyles } from '../useStyles';
import { FormContext } from './FormContext';
import formControlStyles from './FormControl.m.css';
import inputFileTextContentStyles from './InputFileTextContent.m.css';

const DEFAULT_MAX_FILE_SIZE = 2048;

interface Props<TState> extends ILayoutSizeProps {
  name: keyof TState;
  state: TState;
  accept?: string;
  labelTooltip?: string;
  tooltip?: string;
  required?: boolean;
  fileName?: string;
  style?: ComponentStyle;
  /** Max file size in KB */
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  onChange?: (value: string, name: keyof TState) => void;
  mapValue?: (value: string) => string;
}

type InputFileTextContentType = <TState extends Record<string, any>>(props: Props<TState>) => React.ReactElement<any, any>;

export const InputFileTextContent: InputFileTextContentType = observer(function InputFileTextContent({
  name,
  state,
  accept,
  labelTooltip,
  tooltip,
  required,
  fileName,
  style: styleProp,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  disabled,
  className,
  children,
  onChange,
  mapValue,
  ...rest
}: Props<Record<any, any>>) {
  const translate = useTranslate();
  const context = useContext(FormContext);

  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);
  const styles = useS(formControlStyles, elementsSizeStyles, inputFileTextContentStyles);

  const savedExternally = !!fileName && state[name] !== '';
  const saved = savedExternally || !!state[name];

  let description;

  if (selected?.name || savedExternally) {
    description = selected?.name ?? fileName;
  }

  if (error?.message) {
    description = error.message;
  }

  if (!description) {
    description = translate(saved ? 'ui_processing_saved' : 'ui_no_file_chosen');
  }

  function updateValue(value: string) {
    const val = mapValue?.(value) ?? value;

    state[name] = val;
    onChange?.(val, name);
    context?.change(val, name);
  }

  function removeFile() {
    setSelected(null);
    updateValue('');
  }

  function validateFileSize(size: number) {
    const maxFileSizeBytes = maxFileSize * 1024;

    if (size > maxFileSizeBytes) {
      throw new Error(
        translate('ui_file_size_exceeds', undefined, {
          size: bytesToSize(size),
          maxSize: bytesToSize(maxFileSizeBytes),
        }),
      );
    }
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      removeFile();
    } else {
      try {
        validateFileSize(file.size);

        const value = await blobToData(file);

        if (value) {
          setSelected(file);
          updateValue(value);
          setError(null);
        }
      } catch (exception: any) {
        removeFile();
        setError(exception);
      }
    }
  }

  return styled(useStyles(styleProp))(
    <div className={s(styles, { ...layoutProps, field: true }, className)}>
      <div className={s(styles, { fieldLabel: true })} title={labelTooltip}>
        {children}
        {required && ' *'}
      </div>
      <UploadArea title={tooltip} disabled={disabled} accept={accept} reset onChange={handleChange}>
        <Button icon="/icons/import.svg" tag="div" mod={['outlined']} disabled={disabled}>
          {translate('ui_upload_file')}
        </Button>
      </UploadArea>
      <div className={s(styles, { fieldDescription: true })}>
        {description}
        {(selected || saved) && (
          <IconButton
            className={s(styles, { iconButton: true, valid: !error, invalid: !!error })}
            disabled={disabled}
            name="cross"
            onClick={removeFile}
          />
        )}
      </div>
    </div>,
  );
});
