/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  useEffect, useRef, useCallback, ChangeEvent,
} from 'react';
import styled, { use } from 'reshadow';

import { Icon } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { useStyles } from '@dbeaver/core/theming';

import { EditorDialog } from './EditorDialog';
import { InlineEditorStyles } from './styles';

export type InlineEditorControls = 'right' | 'top' | 'bottom' | 'inside'

export type InlineEditorProps = {
  value: string;
  placeholder?: string;
  controlsPosition?: InlineEditorControls;
  simple?: boolean;
  onChange(value: string): void;
  onSave(): void;
  onReject(): void;
  className?: string;
}

export const InlineEditor = observer(function InlineEditor({
  value,
  placeholder,
  controlsPosition = 'right',
  simple,
  onChange,
  onSave,
  onReject,
  className,
}: InlineEditorProps) {
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
    } else {
      onReject();
    }
  }, [value, commonDialogService, onSave, onReject, handleChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSave();
    }
  }, [onSave]);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  return styled(useStyles(InlineEditorStyles))(
    <editor as="div" className={className}>
      <editor-container as="div">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          placeholder={placeholder}
        />
      </editor-container>
      <editor-actions as="div" {...use({ position: controlsPosition })}>
        <editor-action as="div" onClick={onSave}><Icon name="apply" viewBox="0 0 12 10" /></editor-action>
        <editor-action as="div" onClick={onReject}><Icon name="reject" viewBox="0 0 11 11" /></editor-action>
        {!simple && <editor-action as="div" onClick={handlePopup}><Icon name="edit" viewBox="0 0 13 13" /></editor-action>}
      </editor-actions>
    </editor>
  );
});
