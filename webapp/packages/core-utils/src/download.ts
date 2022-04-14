/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function download(content: Blob | string, fileName = '', blank?: boolean): void {
  const saveLink = document.createElement('a');

  saveLink.tabIndex = -1;
  saveLink.download = fileName;
  if (blank) {
    saveLink.target = '_blank';
    saveLink.rel = 'noopener';
  }
  saveLink.style.display = 'none';
  document.body.appendChild(saveLink);

  try {
    const url = typeof content === 'string' ? content : URL.createObjectURL(content);
    saveLink.href = url;
    saveLink.onclick = () => requestAnimationFrame(() => URL.revokeObjectURL(url));
  } catch (e: any) {
    console.error(e);
    console.warn('Error while getting object URL.');
  }

  saveLink.click();
  document.body.removeChild(saveLink);
}
