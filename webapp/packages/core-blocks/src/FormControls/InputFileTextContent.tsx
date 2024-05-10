/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { ReactNode, useContext, useState } from 'react';

import { blobToBase64, bytesToSize } from '@cloudbeaver/core-utils';

import { Button } from '../Button';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { IconButton } from '../IconButton';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { UploadArea } from '../UploadArea';
import { useS } from '../useS';
import { Field } from './Field';
import { FieldDescription } from './FieldDescription';
import { FieldLabel } from './FieldLabel';
import { FormContext } from './FormContext';
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
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  disabled,
  className,
  children,
  onChange,
  mapValue,
}: Props<Record<any, any>>) {
  const translate = useTranslate();
  const context = useContext(FormContext);

  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const styles = useS(inputFileTextContentStyles);

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

        const value = await blobToBase64(file);

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

  return (
    <Field className={className}>
      <FieldLabel title={labelTooltip} required={required} className={s(styles, { fieldLabel: true })}>
        {children}
      </FieldLabel>
      <UploadArea title={tooltip} disabled={disabled} accept={accept} reset onChange={handleChange}>
        <Button icon="/icons/import.svg" tag="div" mod={['outlined']} disabled={disabled}>
          {translate('ui_upload_file')}
        </Button>
      </UploadArea>
      <FieldDescription className={s(styles, { fieldDescription: true })}>
        {description}
        {(selected || saved) && <IconButton className={s(styles, { iconButton: true })} disabled={disabled} name="cross" onClick={removeFile} />}
      </FieldDescription>
    </Field>
  );
});
