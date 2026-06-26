/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DependencyList } from 'react';
export { useHotkeys, type Hotkey } from 'react-hotkeys-hook';

// TODO: types broken in ESM
declare module 'react-hotkeys-hook' {
  export type FormTags =
    | 'input'
    | 'textarea'
    | 'select'
    | 'INPUT'
    | 'TEXTAREA'
    | 'SELECT'
    | 'searchbox'
    | 'slider'
    | 'spinbutton'
    | 'menuitem'
    | 'menuitemcheckbox'
    | 'menuitemradio'
    | 'option'
    | 'radio'
    | 'textbox';
  export type Scopes = string | readonly string[];

  export type EventListenerOptions =
    | {
        capture?: boolean;
        once?: boolean;
        passive?: boolean;
        signal?: AbortSignal;
      }
    | boolean; // useCapture

  export type KeyboardModifiers = {
    alt?: boolean;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    mod?: boolean;
    useKey?: boolean; // Custom modifier to listen to the produced key instead of the code
  };

  export type Hotkey = KeyboardModifiers & {
    keys?: readonly string[];
    scopes?: Scopes;
    description?: string;
    isSequence?: boolean;
    hotkey: string;
    metadata?: Record<string, unknown>;
  };

  export type HotkeysEvent = Hotkey;

  export type Trigger = boolean | ((keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => boolean);

  export type OptionsOrDependencyArray = Options | DependencyList;
  export function useHotkeys<T extends HTMLElement>(
    keys: Keys,
    callback: HotkeyCallback,
    options?: OptionsOrDependencyArray,
    dependencies?: OptionsOrDependencyArray,
  ): import('react').RefObject<T | null>;
}
