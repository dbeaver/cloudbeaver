/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function selectFiles(callback: (files: File[]) => any, multiple?: boolean): void {
  let removed = false;
  const input = document.createElement('input');
  input.type = 'file';

  if (multiple) {
    input.multiple = true;
  }

  input.onchange = () => {
    callback(input.files?.length ? Array.from(input.files) : []);
    removed = true;
    input.remove();
  };
  input.style.position = 'fixed';
  input.style.top = '-100px';
  input.style.left = '-100px';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';
  input.style.zIndex = '-1';
  document.body.append(input);

  input.click();

  setTimeout(
    () => {
      if (!removed) {
        input.remove();
      }
    },
    30 * 60 * 1000,
  );
}
