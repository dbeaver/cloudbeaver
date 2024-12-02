/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ProcessSnackbar, type ProcessSnackbarProps } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { type IProcessNotificationContainer, NotificationService } from '@cloudbeaver/core-events';
import { type ITaskDescriptor, TaskManagerService } from '@cloudbeaver/core-task-manager';

@injectable()
export class TaskManagerPluginBootstrap extends Bootstrap {
  private notification: IProcessNotificationContainer<ProcessSnackbarProps> | null;
  constructor(
    private readonly taskManagerService: TaskManagerService,
    private readonly notificationService: NotificationService,
  ) {
    super();
    this.notification = null;
  }

  override register(): void {
    this.taskManagerService.onDataUpdate.addHandler(this.updateNotification.bind(this));
  }

  private updateNotification(): void {
    if (this.taskManagerService.pendingTasks.length === 0) {
      this.notification?.notification.close();
      this.notification = null;
      return;
    }

    if (!this.notification) {
      this.notification = this.notificationService.processNotification(
        () => ProcessSnackbar,
        {},
        {
          title: 'plugin_task_manager_notification_title',
        },
      );
    }

    this.notification.controller.setMessage(this.taskManagerService.pendingTasks.map(getMessage).join('\n'));
  }
}

function getMessage(task: ITaskDescriptor): string {
  if (task.exception) {
    return task.exception.message;
  }

  let message = task.getMessage();

  if (task.getProgress) {
    message += ` (${Math.floor(task.getProgress() * 100)}%)`;
  }

  return message;
}
