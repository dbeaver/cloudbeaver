/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function copyToClipboard(data: string): void {
  const activeElement = document.activeElement;
  const shadowElement = document.createElement('textarea');
  shadowElement.value = data;
  shadowElement.style.position = 'absolute';
  shadowElement.style.overflow = 'hidden';
  shadowElement.style.width = '0';
  shadowElement.style.height = '0';
  shadowElement.style.top = '0';
  shadowElement.style.left = '0';

  document.body.appendChild(shadowElement);
  shadowElement.select();
  document.execCommand('copy');
  document.body.removeChild(shadowElement);

  if (activeElement instanceof HTMLElement) {
    activeElement.focus({ preventScroll: true });
  }
}
