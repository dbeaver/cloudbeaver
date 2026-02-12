/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Hotkey } from '@cloudbeaver/core-blocks';

// TODO remove once this bug is resolved: https://github.com/JohannesKlauss/react-hotkeys-hook/issues/1318
export function matchesHotkeyModifiers(event: KeyboardEvent, hotkey: Hotkey): boolean {
  if (hotkey.alt !== event.altKey) {
    return false;
  }

  if (hotkey.shift !== event.shiftKey) {
    return false;
  }

  if (hotkey.mod) {
    // mod = meta on Mac, ctrl on Windows/Linux
    if (!event.metaKey && !event.ctrlKey) {
      return false;
    }
  } else {
    if (hotkey.meta !== event.metaKey) {
      return false;
    }

    if (hotkey.ctrl !== event.ctrlKey) {
      return false;
    }
  }

  return true;
}
