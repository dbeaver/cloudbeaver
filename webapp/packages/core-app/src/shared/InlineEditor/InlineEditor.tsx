/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import {
  useEffect, useRef, useCallback, ChangeEvent, useImperativeHandle
} from 'react';
import styled, { use } from 'reshadow';

import { Icon, IconOrImage, Loader, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { useStyles } from '@cloudbeaver/core-theming';

import { EditorDialog } from './EditorDialog';
import { InlineEditorStyles } from './styles';

export type InlineEditorControls = 'right' | 'top' | 'bottom' | 'inside';

export interface InlineEditorProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onKeyDown' | 'autoFocus'> {
  value: string;
  controlsPosition?: InlineEditorControls;
  simple?: boolean;
  hideSave?: boolean;
  hideCancel?: boolean;
  disableSave?: boolean;
  edited?: boolean;
  autofocus?: boolean;
  active?: boolean;
  loading?: boolean;
  onChange: (value: string) => void;
  onSave?: () => void;
  onReject?: () => void;
  onUndo?: () => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

export const InlineEditor = observer<InlineEditorProps, HTMLInputElement | null>(function InlineEditor({
  value,
  controlsPosition = 'right',
  simple,
  hideSave,
  hideCancel,
  disableSave,
  edited = false,
  autofocus,
  active,
  loading,
  disabled,
  onChange,
  onSave,
  onUndo,
  onReject,
  onClick,
  onDoubleClick,
  className,
  ...rest
}, ref) {
  const props = useObjectRef({
    onChange,
    onReject,
    onSave,
    value,
    disableSave,
  });

  const commonDialogService = useService(CommonDialogService);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    props.onChange(event.target.value);
  }, []);

  const handlePopup = useCallback(async () => {
    const newValue = await commonDialogService.open(EditorDialog, props.value);
    if (newValue === DialogueStateResult.Rejected || newValue === DialogueStateResult.Resolved) {
      props.onReject?.();
    } else {
      props.onChange(newValue);
      props.onSave?.();
    }
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        if (!props.disableSave && props.onSave) {
          props.onSave();
        }
        break;
      case 'Escape':
        props.onReject?.();
        break;
    }
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autofocus) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  useImperativeHandle(ref, () => inputRef.current!);

  return styled(useStyles(InlineEditorStyles))(
    <editor as='div' className={className} {...use({ active })} onClick={onClick} onDoubleClick={onDoubleClick}>
      <editor-container>
        <input
          ref={inputRef}
          lang="en"
          value={value}
          autoComplete="off"
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...rest}
        />
      </editor-container>
      <editor-actions as="div" {...use({ position: controlsPosition })} onMouseDown={e => e.preventDefault()}>
        {!hideSave && (
          <editor-action
            as="button"
            disabled={disabled || disableSave}
            onClick={onSave}
          >
            {loading ? <Loader small fullSize /> : <Icon name="apply" viewBox="0 0 12 10" />}
          </editor-action>
        )}
        {!hideCancel && onReject && (
          <editor-action
            as="button"
            disabled={disabled}
            onClick={onReject}
          >
            <Icon name="reject" viewBox="0 0 11 11" />
          </editor-action>
        )}
        {onUndo && (
          <editor-action
            as="button"
            disabled={!edited || disabled}
            onClick={edited ? onUndo : undefined}
          >
            <IconOrImage icon="/icons/data_revert.svg" />
          </editor-action>
        )}
        {!simple && (
          <editor-action
            as="button"
            disabled={disabled}
            onClick={handlePopup}
          >
            <Icon name="edit" viewBox="0 0 13 13" />
          </editor-action>
        )}
      </editor-actions>
    </editor>
  );
}, { forwardRef: true });
