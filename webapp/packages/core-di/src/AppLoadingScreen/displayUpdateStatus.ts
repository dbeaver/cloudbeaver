/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export function displayUpdateStatus(progress: number) {
  document.querySelectorAll('#app-loading-screen .app-loading-screen__updating').forEach(el => el.classList.add('visible'));
  const progressElement = document.querySelector('#app-loading-screen .app-loading-screen__updating_percent');
  if (progressElement) {
    progressElement.textContent = progress * 100 + '%';
  }
}
