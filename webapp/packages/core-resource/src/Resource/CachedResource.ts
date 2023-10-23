/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import {
  ExecutionContext,
  Executor,
  ExecutorInterrupter,
  IExecutionContextProvider,
  IExecutor,
  IExecutorHandler,
  ISyncExecutor,
  SyncExecutor,
  TaskScheduler,
} from '@cloudbeaver/core-executor';

import {
  CachedResourceOffsetPageKey,
  CachedResourceOffsetPageListKey,
  expandOffsetPageRange,
  isOffsetPageInRange,
  isOffsetPageOutdated,
} from './CachedResourceOffsetPageKeys';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata';
import type { IResource } from './IResource';
import { Resource } from './Resource';
import { isResourceAlias } from './ResourceAlias';
import { ResourceError } from './ResourceError';
import type { ResourceKey, ResourceKeyFlat } from './ResourceKey';
import { resourceKeyAlias } from './ResourceKeyAlias';
import { resourceKeyList } from './ResourceKeyList';
import { resourceKeyListAlias } from './ResourceKeyListAlias';
import { ResourceOffsetPagination } from './ResourceOffsetPagination';

export interface IDataError<TKey> {
  param: ResourceKey<TKey>;
  exception: Error;
}

export const CachedResourceParamKey = resourceKeyAlias('@cached-resource/param-default');
export const CachedResourceListEmptyKey = resourceKeyListAlias('@cached-resource/empty');

/**
 * CachedResource is a base class for all resources. It is used to load, cache and manage data from external sources.
 */
export abstract class CachedResource<
  TData,
  TValue,
  TKey,
  TInclude extends ReadonlyArray<string>,
  TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata,
> extends Resource<TData, TKey, TInclude, TValue, TMetadata> {
  readonly onClear: ISyncExecutor;
  readonly onDataOutdated: ISyncExecutor<ResourceKey<TKey>>;
  readonly onDataUpdate: ISyncExecutor<ResourceKey<TKey>>;
  readonly onDataError: ISyncExecutor<IDataError<ResourceKey<TKey>>>;
  readonly beforeLoad: IExecutor<ResourceKey<TKey>>;
  readonly offsetPagination: ResourceOffsetPagination<TKey, TMetadata>;
  protected get loading(): boolean {
    return this.scheduler.executing;
  }

  protected outdateWaitList: ResourceKey<TKey>[];
  protected readonly scheduler: TaskScheduler<ResourceKey<TKey>>;

  /** Need to infer value type */
  private readonly typescriptHack: TValue;

  constructor(defaultKey: ResourceKey<TKey>, defaultValue: () => TData, defaultIncludes: TInclude = [] as any) {
    super(defaultValue, defaultIncludes);

    this.offsetPagination = new ResourceOffsetPagination(this.metadata);

    this.loadingTask = this.loadingTask.bind(this);

    this.typescriptHack = null as any;
    this.outdateWaitList = [];
    this.scheduler = new TaskScheduler(this.isIntersect);
    this.beforeLoad = new Executor(null, this.isIntersect);
    this.onClear = new SyncExecutor();
    this.onDataOutdated = new SyncExecutor<ResourceKey<TKey>>(null);
    this.onDataUpdate = new SyncExecutor<ResourceKey<TKey>>(null);
    this.onDataError = new SyncExecutor<IDataError<ResourceKey<TKey>>>(null);

    this.aliases.add(CachedResourceParamKey, () => defaultKey);
    this.aliases.add(CachedResourceListEmptyKey, () => resourceKeyList([]));
    this.aliases.add(CachedResourceOffsetPageKey, key => key.target);
    this.aliases.add(CachedResourceOffsetPageListKey, key => key.target ?? CachedResourceListEmptyKey);

    // this.logger.spy(this.beforeLoad, 'beforeLoad');
    // this.logger.spy(this.onDataOutdated, 'onDataOutdated');
    this.logger.spy(this.onDataUpdate, 'onDataUpdate');
    this.logger.spy(this.onDataError, 'onDataError');

    makeObservable<this, 'loader' | 'commitIncludes' | 'resetIncludes' | 'markOutdatedSync'>(this, {
      loader: action,
      markLoading: action,
      markLoaded: action,
      markError: action,
      markOutdated: action,
      markUpdated: action,
      commitIncludes: action,
      markOutdatedSync: action,
      resetIncludes: action,
      clear: action,
    });

    setInterval(() => {
      // mark resource outdate when it's not used
      if (!this.useTracker.isResourceInUse && !this.isOutdated()) {
        this.logger.log('not in use');
        this.markOutdated();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Mark resource as in use when {@link resource} is in use
   * @param resource resource to depend on
   */
  connect(resource: IResource<any, any, any, any, any>): void {
    let subscription: string | null = null;

    const subscriptionHandler = () => {
      if (resource.useTracker.isResourceInUse) {
        if (!subscription || !this.useTracker.hasUseId(subscription)) {
          subscription = this.useTracker.use(CachedResourceParamKey);
        }
      } else {
        if (subscription) {
          this.useTracker.free(CachedResourceParamKey, subscription);
          subscription = null;
        }
      }
    };

    resource.useTracker.onUse.addHandler(subscriptionHandler);
    this.onClear.addHandler(subscriptionHandler);
  }

  /**
   * Outdate resource when {@link resource} is outdated.
   * Preload {@link resource} before current resource is loaded and connect {@link resource} to current resource.
   * @param resource - Resource to sync with
   * @param mapTo - Map current resource key to {@link resource} key
   * @param mapOut - Map {@link resource} key to current resource key
   */
  sync<T = TKey>(
    resource: CachedResource<any, any, T, any, any>,
    mapTo?: (param: ResourceKey<TKey>) => ResourceKey<T>,
    mapOut?: (param: ResourceKey<T>) => ResourceKey<TKey>,
  ): void {
    // TODO: do we want to sync "Clean" action?
    resource.outdateResource(this, mapOut);

    resource.onDataUpdate.addHandler(resource.logger.logExecutor('onDataUpdate > ' + this.logger.getName()));
    resource.onDataUpdate.addHandler(resource.logger.logExecutor('onDataUpdate < ' + this.logger.getName()));

    this.preloadResource(resource, mapTo);
  }

  /**
   * Mark {@link resource} as updated when current resource is updated.
   * @param resource - Resource to mark as updated
   * @param mapTo - Map current resource key to {@link resource} key
   * @param mapOut - Map {@link resource} key to current resource key
   */
  updateResource<T = TKey>(resource: CachedResource<any, any, T, any, any>, map?: (param: ResourceKey<TKey>) => ResourceKey<T>): this {
    this.onDataUpdate.addHandler(param => {
      try {
        this.logger.group(' update - ' + resource.logger.getName());

        if (map) {
          param = map(param) as ResourceKey<TKey>;
        }

        resource.markUpdated(param as ResourceKey<T>);
      } finally {
        this.logger.groupEnd();
      }
    });

    return this;
  }

  /**
   * Mark {@link resource} as outdated when current resource is outdated.
   * @param resource - Resource to mark as outdated
   * @param mapTo - Map current resource key to {@link resource} key
   * @param mapOut - Map {@link resource} key to current resource key
   */
  outdateResource<T = TKey>(resource: CachedResource<any, any, T, any, any>, map?: (param: ResourceKey<TKey>) => ResourceKey<T>): this {
    this.onDataOutdated.addHandler(param => {
      try {
        this.logger.group(' outdate - ' + resource.logger.getName());

        if (map) {
          param = map(param) as ResourceKey<TKey>;
        }

        resource.markOutdated(param as ResourceKey<T>);
      } finally {
        this.logger.groupEnd();
      }
    });

    return this;
  }

  /**
   * Preload {@link resource} before current resource is loaded and connect {@link resource} to current resource.
   * @param resource - Resource to preload
   * @param mapTo - Map current resource key to {@link resource} key
   * @param mapOut - Map {@link resource} key to current resource key
   */
  preloadResource<T = TKey>(resource: CachedResource<any, any, T, any, any>, map?: (param: ResourceKey<TKey>) => ResourceKey<T>): this {
    resource.connect(this);

    this.beforeLoad.addHandler(async param => {
      try {
        this.logger.group(' preload - ' + resource.logger.getName());

        if (map) {
          param = map(param) as ResourceKey<TKey>;
        }

        await resource.load(param as ResourceKey<T>);
      } finally {
        this.logger.groupEnd();
      }
    });

    return this;
  }

  /**
   * Execute handler before resource is loaded
   * @param handler - Handler to execute
   */
  before(handler: IExecutorHandler<ResourceKey<TKey>>): this {
    this.beforeLoad.addHandler(async (param, contexts) => {
      try {
        this.logger.group(' before - ' + handler.name);

        await handler(param, contexts);
      } finally {
        this.logger.groupEnd();
      }
    });

    return this;
  }

  isLoaded(param?: ResourceKey<TKey>, includes?: TInclude): boolean {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    if (!this.metadata.has(param)) {
      return false;
    }

    const pageKey = this.aliases.isAlias(param, CachedResourceOffsetPageKey) || this.aliases.isAlias(param, CachedResourceOffsetPageListKey);
    if (pageKey) {
      const pageInfo = this.offsetPagination.getPageInfo(pageKey);

      if (!pageInfo || !isOffsetPageInRange(pageInfo, pageKey.options)) {
        return false;
      }
    }

    return this.metadata.every(param, metadata => metadata.loaded && (!includes || includes.every(include => metadata.includes.includes(include))));
  }

  /**
   * Return promise that will be resolved when resource will finish loading pending requests.
   * Will be resolved immediately if resource is not loading.
   */
  waitLoad(): Promise<void> {
    return this.scheduler.wait();
  }

  isOutdated(param?: ResourceKey<TKey>): boolean {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    const pageKey = this.aliases.isAlias(param, CachedResourceOffsetPageKey) || this.aliases.isAlias(param, CachedResourceOffsetPageListKey);
    if (pageKey) {
      const pageInfo = this.offsetPagination.getPageInfo(pageKey);

      if (isOffsetPageOutdated(pageInfo?.pages || [], pageKey.options)) {
        return true;
      }
    }

    return this.metadata.some(param, metadata => !metadata.loaded || metadata.outdated);
  }

  markLoading(param: ResourceKey<TKey>, state: boolean, context?: TInclude): void {
    this.metadata.update(param, metadata => {
      metadata.loading = state;
    });
  }

  markLoaded(param: ResourceKey<TKey>, includes?: TInclude): void {
    const pageKey = this.aliases.isAlias(param, CachedResourceOffsetPageKey) || this.aliases.isAlias(param, CachedResourceOffsetPageListKey);

    this.metadata.update(param, metadata => {
      metadata.loaded = true;

      if (pageKey) {
        metadata.offsetPage = observable({
          ...metadata.offsetPage,
          pages: expandOffsetPageRange(metadata.offsetPage?.pages || [], pageKey.options, false),
        });
      }

      if (includes) {
        this.commitIncludes(metadata, includes);
      }
    });

    if (isResourceAlias(param)) {
      param = this.aliases.transformToKey(param);

      this.metadata.update(param, metadata => {
        metadata.loaded = true;
        if (includes) {
          this.commitIncludes(metadata, includes);
        }
      });
    }
  }

  markError(exception: Error, key: ResourceKey<TKey>, include?: TInclude): ResourceError {
    exception = new ResourceError(this, key, include, exception.message, { cause: exception });
    const pageKey = this.aliases.isAlias(key, CachedResourceOffsetPageKey) || this.aliases.isAlias(key, CachedResourceOffsetPageListKey);
    this.metadata.update(key, metadata => {
      metadata.exception = exception;
      metadata.outdated = false;

      if (pageKey) {
        metadata.offsetPage = observable({
          ...metadata.offsetPage,
          pages: expandOffsetPageRange(metadata.offsetPage?.pages || [], pageKey.options, false),
        });
      } else {
        metadata.offsetPage?.pages.forEach(page => {
          page.outdated = false;
        });
      }
    });
    if (isResourceAlias(key)) {
      key = this.aliases.transformToAlias(key);
    }
    this.onDataError.execute({ param: key, exception });
    return exception as ResourceError;
  }

  cleanError(param?: ResourceKey<TKey>): void {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    this.metadata.update(param, metadata => {
      metadata.exception = null;
    });
  }

  markOutdated(param?: ResourceKey<TKey>): void {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    const isKeyExecuting = param === CachedResourceParamKey ? this.scheduler.executing : this.scheduler.isExecuting(param);

    if (isKeyExecuting && !this.outdateWaitList.some(key => this.isIntersect(param!, key))) {
      this.outdateWaitList.push(param);
      return;
    }

    this.markOutdatedSync(param);
  }

  markUpdated(param?: ResourceKey<TKey>): void {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }
    const pageKey = this.aliases.isAlias(param, CachedResourceOffsetPageKey) || this.aliases.isAlias(param, CachedResourceOffsetPageListKey);

    this.metadata.update(param, metadata => {
      metadata.outdated = false;

      if (pageKey) {
        metadata.offsetPage = observable({
          ...metadata.offsetPage,
          pages: expandOffsetPageRange(metadata.offsetPage?.pages || [], pageKey.options, false),
        });
      }
    });

    if (isResourceAlias(param)) {
      param = this.aliases.transformToKey(param);

      this.metadata.update(param, metadata => {
        metadata.outdated = false;
      });
    }
  }

  /**
   * Method cleans error for {@link key} when specified or for resource itself.
   * Method will execute {@link onDataUpdate}.
   */
  dataUpdate(key?: ResourceKey<TKey>): void {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }

    this.cleanError(key);
    if (isResourceAlias(key)) {
      key = this.aliases.transformToAlias(key);
    }
    this.onDataUpdate.execute(key);
  }

  async refresh(key?: ResourceKey<TKey>, context?: TInclude): Promise<any> {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }
    await this.loadData(key, true, context);
    return this.data;
  }

  /**
   * Load data for {@link key} when specified or for resource itself.
   * Data loading will be skipped if data already loaded and updated.
   * @param key - Resource key
   * @param context - Includes
   * @returns Resource data
   */
  async load(key?: ResourceKey<TKey>, context?: TInclude): Promise<any> {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }
    await this.loadData(key, false, context);
    return this.data;
  }

  getIncludes(key?: ResourceKeyFlat<TKey>): ReadonlyArray<string> {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }

    if (!this.metadata.has(key)) {
      return this.defaultIncludes;
    }

    const metadata = this.metadata.get(key);
    return metadata.includes;
  }

  clear(): void {
    this.resetDataToDefault();
    this.metadata.clear();
    this.useTracker.clear();
    this.onDataUpdate.execute(this.aliases.transformToAlias(CachedResourceParamKey));
  }

  /**
   * Converts array of includes to map
   * ```
   * {
   *   customIncludeBase: true,
   *   [key]: true
   * }
   * ```
   * @param key - Resource to extract includes from metadata
   * @param includes - Base includes
   * @returns {Object} Object where key is include name and value is true
   */
  getIncludesMap(key?: ResourceKeyFlat<TKey>, includes: ReadonlyArray<string> = this.defaultIncludes): Record<string, any> {
    const keyIncludes = this.getIncludes(key);
    return ['customIncludeBase', ...includes, ...keyIncludes].reduce<any>((map, key) => {
      map[key] = true;

      return map;
    }, {});
  }

  protected resetIncludes(): void {
    this.metadata.update(metadata => {
      metadata.includes = observable([...this.defaultIncludes]);
    });
  }

  protected commitIncludes(metadata: TMetadata, includes: ReadonlyArray<string>): void {
    for (const include of includes) {
      if (!metadata.includes.includes(include)) {
        metadata.includes.push(include);
      }
    }
  }

  protected resetDataToDefault(): void {
    this.setData(this.defaultValue());
  }

  protected setData(data: TData): void {
    this.data = data;
  }

  protected markOutdatedSync(key: ResourceKey<TKey>): void {
    // Commented because it can lead to skipping existing keys outdate if some of them doesn't exists
    // if (!this.metadata.has(key)) {
    //   return;
    // }
    const pageKey = this.aliases.isAlias(key, CachedResourceOffsetPageKey) || this.aliases.isAlias(key, CachedResourceOffsetPageListKey);
    this.metadata.update(key, metadata => {
      metadata.outdated = true;

      if (pageKey) {
        metadata.offsetPage = observable({
          ...metadata.offsetPage,
          pages: expandOffsetPageRange(metadata.offsetPage?.pages || [], pageKey.options, true),
        });
      } else {
        metadata.offsetPage?.pages.forEach(page => {
          page.outdated = true;
        });
      }
    });

    if (isResourceAlias(key)) {
      key = this.aliases.transformToKey(key);

      this.metadata.update(key, metadata => {
        metadata.outdated = true;
        metadata.offsetPage?.pages.forEach(page => {
          page.outdated = true;
        });
      });
    }

    this.onDataOutdated.execute(key);
  }

  protected async preLoadData(
    param: ResourceKey<TKey>,
    contexts: IExecutionContextProvider<ResourceKey<TKey>>,
    refresh: boolean,
    context?: TInclude,
  ): Promise<void> {}

  protected abstract loader(param: ResourceKey<TKey>, include: ReadonlyArray<string> | undefined, refresh: boolean): Promise<TData>;

  /**
   * Implements same behavior as {@link CachedResource.load} and {@link CachedResource.refresh} for custom loaders.
   * Resource will be marked as loading and will be marked as loaded after loader is finished.
   * Exceptions will be handled and stored in metadata.
   * @param key - Resource key
   * @param include - Includes
   * @param update - Update function
   */
  async performUpdate<T>(
    key: ResourceKey<TKey>,
    include: TInclude | undefined,
    update: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => Promise<T>,
  ): Promise<T>;

  /**
   * Implements same behavior as {@link CachedResource.load} and {@link CachedResource.refresh} for custom loaders.
   * Resource will be marked as loading and will be marked as loaded after loader is finished.
   * Exceptions will be handled and stored in metadata.
   * @param key - Resource key
   * @param include - Includes
   * @param update - Update function
   * @param exitCheck - Function will be called before calling {@link update} function. If it returns true then update will be skipped.
   */
  async performUpdate<T>(
    key: ResourceKey<TKey>,
    include: TInclude | undefined,
    update: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => Promise<T>,
    exitCheck: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => boolean,
  ): Promise<T | undefined>;

  /**
   * Implements same behavior as {@link CachedResource.load} and {@link CachedResource.refresh} for custom loaders.
   * Resource will be marked as loading and will be marked as loaded after loader is finished.
   * Exceptions will be handled and stored in metadata.
   * @param key - Resource key
   * @param include - Includes
   * @param update - Update function
   * @param exitCheck - Function will be called before calling {@link update} function. If it returns true then update will be skipped.
   */
  async performUpdate<T>(
    key: ResourceKey<TKey>,
    include: TInclude | undefined,
    update: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => Promise<T>,
    exitCheck?: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => boolean,
  ): Promise<T | undefined> {
    if (isResourceAlias(key)) {
      key = this.aliases.transformToAlias(key);
    }

    const context = new ExecutionContext(key);
    await this.preLoadData(key, context, true, include);
    await this.beforeLoad.execute(key, context);

    if (ExecutorInterrupter.isInterrupted(context)) {
      return;
    }

    await this.scheduler.waitRelease(key);

    if (exitCheck?.(key, include)) {
      return;
    }

    let loaded = false;
    return this.scheduler.schedule(
      key,
      async () => {
        // repeated because previous task maybe has been load requested data
        if (exitCheck?.(key, include)) {
          return;
        }

        this.markLoading(key, true, include);
        try {
          const result = await this.taskWrapper(key, include, true, update);
          loaded = true;
          return result;
        } finally {
          this.markLoading(key, false, include);
        }
      },
      {
        success: () => {
          if (loaded) {
            this.onDataOutdated.execute(key); // TODO: probably need to remove, we need to notify any related resources that subscribed to .onOutdate, to recursively outdate them
            this.dataUpdate(key);
          }
        },
        error: exception => {
          this.markOutdatedSync(key);
          this.markError(exception, key, include);
        },
        after: () => {
          this.flushOutdatedWaitList();
        },
      },
    );
  }

  protected async loadData(key: ResourceKey<TKey>, refresh: boolean, include?: TInclude): Promise<void> {
    if (isResourceAlias(key)) {
      key = this.aliases.transformToAlias(key);
    }
    const contexts = new ExecutionContext(key);
    if (!refresh) {
      if (!this.isLoadable(key, include)) {
        return;
      }

      await this.scheduler.waitRelease(key);

      if (!this.isLoadable(key, include)) {
        return;
      }
    }

    await this.preLoadData(key, contexts, refresh, include);
    await this.beforeLoad.execute(key, contexts);

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    let loaded = false;
    await this.scheduler.schedule(
      key,
      async () => {
        // repeated because previous task maybe has been load requested data
        if (!refresh && !this.isLoadable(key, include)) {
          return;
        }

        this.markLoading(key, true, include);
        try {
          const result = await this.taskWrapper(key, include, refresh, this.loadingTask);
          loaded = true;
          this.markLoaded(key, include);
          return result;
        } finally {
          this.markLoading(key, false, include);
        }
      },
      {
        before: () => {
          if (refresh) {
            this.markOutdatedSync(key);
          }
        },
        success: async () => {
          if (loaded) {
            this.dataUpdate(key);
          }
        },
        error: exception => this.markError(exception, key, include),
        after: () => {
          this.flushOutdatedWaitList();
        },
      },
    );
  }

  private async loadingTask(param: ResourceKey<TKey>, context: ReadonlyArray<string> | undefined, refresh: boolean) {
    this.setData(await this.loader(param, context, refresh));
  }

  private async taskWrapper<T>(
    param: ResourceKey<TKey>,
    context: ReadonlyArray<string> | undefined,
    refresh: boolean,
    promise: (param: ResourceKey<TKey>, context: ReadonlyArray<string> | undefined, refresh: boolean) => Promise<T>,
  ) {
    this.logger.log('loading');

    const value = await promise(param, context, refresh);
    this.markUpdated(param);
    return value;
  }

  private flushOutdatedWaitList(): void {
    for (let i = 0; i < this.outdateWaitList.length; i++) {
      const key = this.outdateWaitList[i];
      this.markOutdatedSync(key);
    }
    this.outdateWaitList = [];
  }
}
