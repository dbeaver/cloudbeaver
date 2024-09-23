/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { FormBaseService } from '../FormBaseService.js';
import type { IFormState } from '../IFormState.js';

export interface IBaseFormSubmitInfo {
  success: boolean;
  creating: boolean;
}

export interface IBaseFormProps<TState> {
  service: FormBaseService<TState>;
  state: IFormState<TState>;
  onSubmit?: (info: IBaseFormSubmitInfo) => void;
  onClose?: () => void;
}
