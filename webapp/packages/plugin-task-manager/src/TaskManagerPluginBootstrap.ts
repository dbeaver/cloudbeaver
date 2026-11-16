/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ProcessSnackbar, type ProcessSnackbarProps } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type IProcessNotificationContainer, NotificationService } from '@cloudbeaver/core-events';
import { type ITaskDescriptor, TaskManagerService } from '@cloudbeaver/core-task-manager';

export class TaskManagerPluginBootstrapImpl extends Bootstrap {
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

export type TaskManagerPluginBootstrap = TaskManagerPluginBootstrapImpl;

export class TaskManagerPluginBootstrapDI extends Context.Service<TaskManagerPluginBootstrapDI, TaskManagerPluginBootstrapImpl>()(
  '@cloudbeaver/plugin-task-manager/TaskManagerPluginBootstrap#TaskManagerPluginBootstrap',
) {
  static readonly implementation = TaskManagerPluginBootstrapImpl;

  static readonly dependencies = () => [TaskManagerService, NotificationService] as const;
  static readonly make: Effect.Effect<
    TaskManagerPluginBootstrapImpl,
    never,
    Context.Service.Identifier<typeof TaskManagerService> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeTaskManagerPluginBootstrap() {
    const taskManagerService = yield* TaskManagerService;
    const notificationService = yield* NotificationService;

    return new TaskManagerPluginBootstrapImpl(taskManagerService, notificationService);
  });
  static readonly layer: Layer.Layer<
    TaskManagerPluginBootstrapDI,
    never,
    Context.Service.Identifier<typeof TaskManagerService> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TaskManagerPluginBootstrap = TaskManagerPluginBootstrapDI;

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
