/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { ChangeEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { Icon, IconOrImage, Loader, s, useObjectRef, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';

import { EditorDialog } from './EditorDialog';
import style from './InlineEditor.m.css';

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
    const styles = useS(style);
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
      if (autofocus && !disabled) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, [disabled]);

    useImperativeHandle(ref, () => inputRef.current!);

    return (
      <div className={s(styles, { editor: true, active }, className)} onClick={onClick} onDoubleClick={onDoubleClick}>
        <div className={s(styles, { editorContainer: true })}>
          <input
            ref={inputRef}
            className={s(styles, { input: true })}
            lang="en"
            value={value}
            autoComplete="off"
            disabled={disabled}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            {...rest}
          />
        </div>
        <div className={s(styles, { editorActions: true })} data-s-position={controlsPosition} onMouseDown={e => e.preventDefault()}>
          {!hideSave && (
            <button className={s(styles, { editorAction: true })} disabled={disabled || disableSave} onClick={onSave}>
              {loading ? (
                <Loader className={s(styles, { loader: true })} small fullSize />
              ) : (
                <Icon className={s(styles, { icon: true })} name="apply" viewBox="0 0 12 10" />
              )}
            </button>
          )}
          {!hideCancel && onReject && (
            <button className={s(styles, { editorAction: true })} disabled={disabled} onClick={onReject}>
              <Icon className={s(styles, { icon: true })} name="reject" viewBox="0 0 11 11" />
            </button>
          )}
          {onUndo && (
            <button className={s(styles, { editorAction: true })} disabled={!edited || disabled} onClick={edited ? onUndo : undefined}>
              <IconOrImage className={s(styles, { iconOrImage: true })} icon="/icons/data_revert.svg" />
            </button>
          )}
          {!simple && (
            <button className={s(styles, { editorAction: true })} disabled={disabled} onClick={handlePopup}>
              <Icon className={s(styles, { icon: true })} name="edit" viewBox="0 0 13 13" />
            </button>
          )}
        </div>
      </div>
    );
  }),
);
