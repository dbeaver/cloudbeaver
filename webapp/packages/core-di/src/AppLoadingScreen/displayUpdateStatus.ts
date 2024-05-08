/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export function displayUpdateStatus(progress: number, message?: string) {
  if (message !== undefined) {
    const messageElement = document.querySelector('#app-loading-screen .app-loading-screen__status_message');
    if (messageElement) {
      messageElement.textContent = message;
    }
  }
  const progressElement = document.querySelector('#app-loading-screen .app-loading-screen__status_percent');
  if (progressElement) {
    progressElement.textContent = (progress * 100).toFixed(0) + '%';
  }
}
