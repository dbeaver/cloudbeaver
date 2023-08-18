/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { ChangeEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import styled, { use } from 'reshadow';

import { Icon, IconOrImage, Loader, useObjectRef, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { Autocompletion } from '../Autocompletion/Autocompletion';
import type { IAutocompletion } from '../Autocompletion/useAutocompletion';
import { useAutocompletion } from '../Autocompletion/useAutocompletion';
import { EditorDialog } from './EditorDialog';
import { InlineEditorStyles } from './styles';

export type InlineEditorControls = 'right' | 'top' | 'bottom' | 'inside';

export interface InlineEditorProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onKeyDown' | 'autoFocus' | 'style'> {
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
  style?: ComponentStyle;
  autocompletionItems?: IAutocompletion[];
  onChange: (value: string) => void;
  onSave?: () => void;
  onReject?: () => void;
  onUndo?: () => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

export const InlineEditor = observer<InlineEditorProps, HTMLInputElement>(
  forwardRef(function InlineEditor(
    {
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
      style,
      autocompletionItems,
      onChange,
      onSave,
      onUndo,
      onReject,
      onClick,
      onDoubleClick,
      className,
      ...rest
    },
    ref,
  ) {
    const props = useObjectRef({
      onChange,
      onReject,
      onSave,
      value,
      disableSave,
    });

    const commonDialogService = useService(CommonDialogService);
    const { state: autocompletionState, show } = useAutocompletion({
      source: () => autocompletionItems || null,
      onChange: props.onChange,
      binding: 'Ctrl+Space',
      updateDelay: 250,
    });

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
      props.onChange(event.target.value);
      show(event.target.value, event.target.selectionStart || 0);
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

    useEffect(() => {
      if (autofocus && !disabled) {
        setTimeout(() => autocompletionState.inputRef?.focus(), 100);
      }
    }, [disabled]);

    useImperativeHandle(ref, () => autocompletionState.inputRef!);

    return styled(useStyles(InlineEditorStyles, style))(
      <editor className={className} {...use({ active })} onClick={onClick} onDoubleClick={onDoubleClick}>
        <editor-container>
          <input
            ref={autocompletionState.setInputRef}
            lang="en"
            value={value}
            autoComplete="off"
            disabled={disabled}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            {...rest}
          />
          {autocompletionState && (
            <Autocompletion ref={autocompletionState.menuRef} items={autocompletionState.completions} onSelect={autocompletionState.onSelect} />
          )}
        </editor-container>
        <editor-actions as="div" {...use({ position: controlsPosition })} onMouseDown={e => e.preventDefault()}>
          {!hideSave && (
            <editor-action as="button" disabled={disabled || disableSave} onClick={onSave}>
              {loading ? <Loader small fullSize /> : <Icon name="apply" viewBox="0 0 12 10" />}
            </editor-action>
          )}
          {!hideCancel && onReject && (
            <editor-action as="button" disabled={disabled} onClick={onReject}>
              <Icon name="reject" viewBox="0 0 11 11" />
            </editor-action>
          )}
          {onUndo && (
            <editor-action as="button" disabled={!edited || disabled} onClick={edited ? onUndo : undefined}>
              <IconOrImage icon="/icons/data_revert.svg" />
            </editor-action>
          )}
          {!simple && (
            <editor-action as="button" disabled={disabled} onClick={handlePopup}>
              <Icon name="edit" viewBox="0 0 13 13" />
            </editor-action>
          )}
        </editor-actions>
      </editor>,
    );
  }),
);
