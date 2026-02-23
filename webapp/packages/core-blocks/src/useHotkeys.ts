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
  export type Keys = string | readonly string[];
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

  export type HotkeyCallback = (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => void;

  export type Trigger = boolean | ((keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => boolean);

  export type Options = {
    // Main setting that determines if the hotkey is enabled or not. (Default: true)
    enabled?: Trigger;
    // Enable hotkeys on a list of tags. (Default: false)
    enableOnFormTags?: readonly FormTags[] | boolean;
    // Enable hotkeys on tags with contentEditable props. (Default: false)
    enableOnContentEditable?: boolean;
    // Ignore evenets based on a condition (Default: undefined)
    ignoreEventWhen?: (e: KeyboardEvent) => boolean;
    // Character to split keys in hotkeys combinations. (Default: +)
    splitKey?: string;
    // Character to separate different hotkeys. (Default: ,)
    delimiter?: string;
    // Scope of the hotkey. (Default: undefined)
    scopes?: Scopes;
    // Trigger on keyup event? (Default: undefined)
    keyup?: boolean;
    // Trigger on keydown event? (Default: true)
    keydown?: boolean;
    // Prevent default browser behavior? (Default: false)
    preventDefault?: Trigger;
    // Use this option to describe what the hotkey does. (Default: undefined)
    description?: string;
    // Listen to events on the document instead of the window. (Default: false)
    document?: Document;
    // Ignore modifiers when matching hotkeys. (Default: false)
    ignoreModifiers?: boolean;
    // Pass through event listener options. (Default: undefined)
    eventListenerOptions?: EventListenerOptions;
    // Listen to the produced key instead of the code. (Default: false)
    useKey?: boolean;
    // The timeout to wait for the next key to be pressed. (Default: 1000ms)
    sequenceTimeoutMs?: number;
    // The character to split the sequence of keys. (Default: >)
    sequenceSplitKey?: string;
    // MetaData | Custom data to store and retrieve with the hotkey (Default: undefined)
    metadata?: Record<string, unknown>;
  };

  export type OptionsOrDependencyArray = Options | DependencyList;
  export function useHotkeys<T extends HTMLElement>(
    keys: Keys,
    callback: HotkeyCallback,
    options?: OptionsOrDependencyArray,
    dependencies?: OptionsOrDependencyArray,
  ): import('react').RefObject<T | null>;
}
