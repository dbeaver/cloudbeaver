/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export { useHotkeys, type Hotkey } from 'react-hotkeys-hook';

// TODO: types broken in ESM
declare module 'react-hotkeys-hook' {
  export type FormTags = 'input' | 'textarea' | 'select' | 'INPUT' | 'TEXTAREA' | 'SELECT';
  export type Keys = string | readonly string[];
  export type Scopes = string | readonly string[];
  export type KeyboardModifiers = {
    alt?: boolean;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    mod?: boolean;
    useKey?: boolean;
  };
  export type Hotkey = KeyboardModifiers & {
    keys?: readonly string[];
    scopes?: Scopes;
    description?: string;
    isSequence?: boolean;
  };
  export type HotkeysEvent = Hotkey;
  export type HotkeyCallback = (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => void;
  export type Trigger = boolean | ((keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => boolean);
  export type Options = {
    enabled?: Trigger;
    enableOnFormTags?: readonly FormTags[] | boolean;
    enableOnContentEditable?: boolean;
    ignoreEventWhen?: (e: KeyboardEvent) => boolean;
    splitKey?: string;
    delimiter?: string;
    scopes?: Scopes;
    keyup?: boolean;
    keydown?: boolean;
    preventDefault?: Trigger;
    description?: string;
    document?: Document;
    ignoreModifiers?: boolean;
    eventListenerOptions?: EventListenerOptions;
    useKey?: boolean;
    sequenceTimeoutMs?: number;
    sequenceSplitKey?: string;
  };
  export type OptionsOrDependencyArray = Options | import('react').DependencyList;
  export function useHotkeys<T extends HTMLElement>(
    keys: Keys,
    callback: HotkeyCallback,
    options?: OptionsOrDependencyArray,
    dependencies?: OptionsOrDependencyArray,
  ): import('react').RefObject<T | null>;
}
