/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { type ChangeEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { Icon, IconOrImage, Loader, s, useObjectRef, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';

import { EditorDialog } from './EditorDialog.js';
import styles from './InlineEditor.module.css';

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
    const style = useS(styles);
    const translate = useTranslate();

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
      if (autofocus && !disabled) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, [disabled]);

    useImperativeHandle(ref, () => inputRef.current!);

    return (
      <div className={s(style, { editor: true, specific: true, editorActive: active }, className)} onClick={onClick} onDoubleClick={onDoubleClick}>
        <div className={s(style, { editorContainer: true })}>
          <input
            ref={inputRef}
            className={s(style, { input: true })}
            lang="en"
            value={value}
            autoComplete="off"
            disabled={disabled}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            {...rest}
          />
        </div>
        <div
          className={s(style, {
            editorActions: true,
          })}
          data-s-position={controlsPosition}
          onMouseDown={e => e.preventDefault()}
        >
          {!hideSave && (
            <EditorAction title={translate('ui_apply')} disabled={disabled || disableSave} onClick={onSave}>
              {loading ? (
                <Loader className={s(style, { loader: true })} small fullSize />
              ) : (
                <Icon className={s(style, { icon: true })} name="apply" viewBox="0 0 12 10" />
              )}
            </EditorAction>
          )}
          {!hideCancel && onReject && (
            <EditorAction title={translate('ui_cancel')} disabled={disabled} onClick={onReject}>
              <Icon className={s(style, { icon: true })} name="reject" viewBox="0 0 11 11" />
            </EditorAction>
          )}
          {onUndo && (
            <EditorAction title={translate('ui_undo')} disabled={!edited || disabled} onClick={edited ? onUndo : undefined}>
              <IconOrImage className={s(style, { iconOrImage: true })} icon="/icons/data_revert.svg" />
            </EditorAction>
          )}
          {!simple && (
            <EditorAction title={translate('ui_edit')} disabled={disabled} onClick={handlePopup}>
              <Icon className={s(style, { icon: true })} name="edit" viewBox="0 0 13 13" />
            </EditorAction>
          )}
        </div>
      </div>
    );
  }),
);

const EditorAction = observer<React.ButtonHTMLAttributes<HTMLButtonElement>>(function EditorAction({ children, ...props }) {
  const style = useS(styles);

  return (
    <button className={s(style, { editorAction: true })} {...props}>
      {children}
    </button>
  );
});
