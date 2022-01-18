/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function download(blob: Blob, fileName: string): void {
  const saveLink = document.createElement('a');

  saveLink.tabIndex = -1;
  saveLink.download = fileName;
  saveLink.style.display = 'none';
  document.body.appendChild(saveLink);

  try {
    const url = URL.createObjectURL(blob);
    saveLink.href = url;
    saveLink.onclick = () => requestAnimationFrame(() => URL.revokeObjectURL(url));
  } catch (e) {
    console.error(e);
    console.warn('Error while getting object URL.');
  }

  saveLink.click();
  document.body.removeChild(saveLink);
}
