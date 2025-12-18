/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function promptForFiles({ multiple = false, accept }: { multiple?: boolean; accept?: string } = {}): Promise<File[]> {
  return new Promise<File[]>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';

    // Keep it in the DOM but invisible/off-screen (safer for Safari)
    Object.assign(input.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      opacity: '0',
      pointerEvents: 'none',
      width: '0',
      height: '0',
    });

    if (multiple) {
      input.multiple = true;
    }
    if (accept) {
      input.accept = accept;
    }

    let settled = false;

    const SAFETY_TIMEOUT_MS = 10 * 60 * 1000;
    const safetyTimeoutId = setTimeout(() => {
      if (!settled) {
        settleErr(new Error('File selection timed out'));
      }
    }, SAFETY_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(safetyTimeoutId);

      if (input.isConnected) {
        document.body.removeChild(input);
      }
    }

    function settleOk(files: File[]) {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(files);
      }
    }

    function settleErr(err: Error) {
      if (!settled) {
        settled = true;
        cleanup();
        reject(err);
      }
    }

    input.addEventListener('change', () => {
      if (input.files && input.files.length > 0) {
        settleOk(Array.from(input.files));
      } else {
        settleErr(new Error('No files selected'));
      }
    });

    input.addEventListener('cancel', () => {
      settleOk([]);
    });

    document.body.appendChild(input);

    try {
      input.showPicker();
    } catch (err) {
      settleErr(err instanceof Error ? err : new Error('File dialog blocked'));
    }
  });
}
