/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import {
  useEffect, useRef, useCallback, ChangeEvent
} from 'react';
import { useImperativeHandle } from 'react';
import styled, { use } from 'reshadow';

import { Icon } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { useStyles } from '@cloudbeaver/core-theming';

import { EditorDialog } from './EditorDialog';
import { InlineEditorStyles } from './styles';

export type InlineEditorControls = 'right' | 'top' | 'bottom' | 'inside';

export interface InlineEditorProps {
  name?: string;
  value: string;
  type?: string;
  placeholder?: string;
  controlsPosition?: InlineEditorControls;
  tabIndex?: number;
  simple?: boolean;
  hideSave?: boolean;
  hideCancel?: boolean;
  edited?: boolean;
  disabled?: boolean;
  autofocus?: boolean;
  active?: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onReject?: () => void;
  onUndo: () => void;
  className?: string;
}

export const InlineEditor = observer<InlineEditorProps, HTMLInputElement | null>(function InlineEditor({
  name,
  value,
  type = 'text',
  placeholder,
  controlsPosition = 'right',
  tabIndex,
  simple,
  hideSave,
  hideCancel,
  edited = false,
  disabled,
  autofocus,
  active,
  onChange,
  onSave,
  onUndo,
  onReject,
  className,
}, ref) {
  const commonDialogService = useService(CommonDialogService);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>| string) => {
    const newValue = typeof event === 'string' ? event : event.target.value;
    onChange(newValue);
  }, [onChange]);

  const handlePopup = useCallback(async () => {
    const newValue = await commonDialogService.open(EditorDialog, value);
    if (typeof newValue === 'string') {
      handleChange(newValue);
      onSave();
    } else if (onReject) {
      onReject();
    }
  }, [value, commonDialogService, onSave, onReject, handleChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        onSave();
        break;
      case 'Escape':
        onReject?.();
        break;
    }
  }, [onSave, onReject]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autofocus) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  useImperativeHandle(ref, () => inputRef.current!);

  return styled(useStyles(InlineEditorStyles))(
    <editor as="div" className={className} {...use({ active })}>
      <editor-container as="div">
        <input
          ref={inputRef}
          name={name}
          lang="en"
          type={type}
          value={value}
          tabIndex={tabIndex}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </editor-container>
      <editor-actions as="div" {...use({ position: controlsPosition })}>
        {!hideSave && <editor-action as="div" onClick={onSave}><Icon name="apply" viewBox="0 0 12 10" /></editor-action>}
        {!hideCancel && onReject && <editor-action as="div" onClick={onReject}><Icon name="reject" viewBox="0 0 11 11" /></editor-action>}
        {onUndo && <editor-action as="div" onClick={edited ? onUndo : () => {}} {...use({ disabled: !edited })}><Icon name="reject" viewBox="0 0 11 11" /></editor-action>}
        {!simple && <editor-action as="div" onClick={handlePopup}><Icon name="edit" viewBox="0 0 13 13" /></editor-action>}
      </editor-actions>
    </editor>
  );
}, { forwardRef: true });
