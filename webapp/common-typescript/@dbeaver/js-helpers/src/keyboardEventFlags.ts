/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const STOP_CAPTURE_VIEW_HOTKEYS_FLAG = '__cloudbeaver_stop_capture_view_hotkeys__';

type TEventWithFlags = Record<string, unknown> & {
  [STOP_CAPTURE_VIEW_HOTKEYS_FLAG]?: boolean;
};

export function stopCaptureViewHotkeys(event: object): void {
  (event as TEventWithFlags)[STOP_CAPTURE_VIEW_HOTKEYS_FLAG] = true;
}

export function isCaptureViewHotkeysStopped(event: object): boolean {
  return Boolean((event as TEventWithFlags)[STOP_CAPTURE_VIEW_HOTKEYS_FLAG]);
}
