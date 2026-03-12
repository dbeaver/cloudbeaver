/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

export interface ITreeSettings {
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    delete(key: string): void;
    clear(): void;
    replace(entries: Record<string, unknown>): void;
}

export interface ITreeSettingsOptions {
    initialSettings?: Record<string, unknown>;
    onChange?(entities: ReadonlyMap<string, unknown>): void;
}

export function useTreeSettings(options: ITreeSettingsOptions = {}): ITreeSettings {
    const { initialSettings = {}, onChange } = options;

    return useObservableRef(
        () => ({
            settings: observable.map<string, unknown>(initialSettings),
            get<T>(key: string): T | undefined {
                return this.settings.get(key) as T | undefined;
            },
            set<T>(key: string, value: T): void {
                this.settings.set(key, value);
                onChange?.(this.settings);
            },
            delete(key: string): void {
                this.settings.delete(key);
                onChange?.(this.settings);
            },
            clear(): void {
                this.settings.clear();
                onChange?.(this.settings);
            },
            replace(entries: Record<string, unknown>): void {
                this.settings.replace(entries);
            },
        }),
        {
            settings: observable.ref,
            set: action.bound,
            delete: action.bound,
            clear: action.bound,
            replace: action.bound,
        },
        false,
    );
}