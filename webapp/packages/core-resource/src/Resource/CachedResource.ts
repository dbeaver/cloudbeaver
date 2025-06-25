/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import {
  ExecutionContext,
  Executor,
  ExecutorInterrupter,
  type IExecutionContextProvider,
  type IExecutor,
  type IExecutorHandler,
  type ISyncExecutor,
  SyncExecutor,
  TaskScheduler,
} from '@cloudbeaver/core-executor';
import { getFirstException, isContainsException } from '@cloudbeaver/core-utils';

import {
  CachedResourceOffsetPageKey,
  CachedResourceOffsetPageListKey,
  CachedResourceOffsetPageTargetKey,
  isOffsetPageInRange,
  isOffsetPageOutdated,
} from './CachedResourceOffsetPageKeys.js';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata.js';
import type { IResource } from './IResource.js';
import { Resource } from './Resource.js';
import { isResourceAlias } from './ResourceAlias.js';
import { ResourceError } from './ResourceError.js';
import type { ResourceKey, ResourceKeyFlat } from './ResourceKey.js';
import { resourceKeyAlias } from './ResourceKeyAlias.js';
import { isResourceKeyList, resourceKeyList } from './ResourceKeyList.js';
import { resourceKeyListAlias } from './ResourceKeyListAlias.js';
import { ResourceOffsetPagination } from './ResourceOffsetPagination.js';

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

  constructor(defaultKey: ResourceKey<TKey>, defaultValue: () => TData, defaultIncludes: TInclude = [] as any) {
    super(defaultValue, defaultIncludes);

    this.offsetPagination = new ResourceOffsetPagination(this.metadata, this.getKeyRef.bind(this));

    this.loadingTask = this.loadingTask.bind(this);

    this.outdateWaitList = [];
    this.scheduler = new TaskScheduler(this.isIntersect);
    this.beforeLoad = new Executor(null, this.isIntersect);
    this.onClear = new SyncExecutor();
    this.onDataOutdated = new SyncExecutor<ResourceKey<TKey>>(null);
    this.onDataUpdate = new SyncExecutor<ResourceKey<TKey>>(null);
    this.onDataError = new SyncExecutor<IDataError<ResourceKey<TKey>>>(null);

    this.aliases.add(CachedResourceParamKey, () => defaultKey);
    this.aliases.add(CachedResourceListEmptyKey, () => resourceKeyList([]));
    this.aliases.add(CachedResourceOffsetPageTargetKey, key => key.options.target);
    this.aliases.add(
      CachedResourceOffsetPageListKey,
      key => key.parent! as any,
      (param, key) => {
        if (!isResourceKeyList(key)) {
          return key as any;
        }

        const keys = new Set<any>();
        const pageInfo = this.offsetPagination.getPageInfo(param);

        if (pageInfo) {
          const from = param.options.offset;
          const to = param.options.offset + param.options.limit;

          for (const page of pageInfo.pages) {
            if (page.isHasCommonSegment(from, to)) {
              for (const pageKey of page.get(from, to)) {
                keys.add(pageKey);
              }
            }
          }
        }
        return resourceKeyList(key.filter(value => keys.has(value)));
      },
    );
    this.aliases.add(
      CachedResourceOffsetPageKey,
      key => key.parent! as any,
      (param, key) => {
        if (!isResourceKeyList(key)) {
          return key as any;
        }

        const keys = new Set<any>();
        const pageInfo = this.offsetPagination.getPageInfo(param);

        if (pageInfo) {
          const from = param.options.offset;
          const to = param.options.offset + param.options.limit;

          for (const page of pageInfo.pages) {
            if (page.isHasCommonSegment(from, to)) {
              for (const pageKey of page.get(from, to)) {
                keys.add(pageKey);
              }
            }
          }
        }
        return resourceKeyList(key.filter(value => keys.has(value)));
      },
    );

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

    setInterval(
      () => {
        // mark resource outdate when it's not used
        if (!this.useTracker.isResourceInUse && !this.isOutdated()) {
          this.logger.log('not in use');
          this.markOutdated();
        }
      },
      5 * 60 * 1000,
    );
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

  isOutdated(param?: ResourceKey<TKey>, includes?: TInclude): boolean {
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

    return this.metadata.some(
      param,
      metadata => !metadata.loaded || metadata.outdated || !!includes?.some(include => metadata.outdatedIncludes.includes(include)),
    );
  }

  markLoading(param: ResourceKey<TKey>, state: boolean, context?: TInclude): void {
    this.metadata.update(param, metadata => {
      metadata.loading = state;
    });
  }

  markLoaded(param: ResourceKey<TKey>, includes?: TInclude): void {
    this.metadata.update(param, metadata => {
      metadata.loaded = true;

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
    exception = new ResourceError(this, key, exception.message, { cause: exception });
    const pageKey = this.aliases.isAlias(key, CachedResourceOffsetPageKey) || this.aliases.isAlias(key, CachedResourceOffsetPageListKey);
    this.metadata.update(key, metadata => {
      metadata.exception = exception;
      metadata.outdated = false;

      if (pageKey) {
        const from = pageKey.options.offset;
        const to = from + pageKey.options.limit;

        metadata.offsetPage?.pages.forEach(page => {
          if (page.isInRange(from, to)) {
            page.setOutdated(false);
          }
        });
      } else {
        metadata.offsetPage?.pages.forEach(page => {
          page.setOutdated(false);
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
        const from = pageKey.options.offset;
        const to = from + pageKey.options.limit;

        metadata.offsetPage?.pages.forEach(page => {
          if (page.isInRange(from, to)) {
            page.setOutdated(false);
          }
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
      metadata.outdatedIncludes = observable([...this.defaultIncludes]);
    });
  }

  protected commitIncludes(metadata: TMetadata, includes: ReadonlyArray<string>): void {
    for (const include of includes) {
      if (!metadata.includes.includes(include)) {
        metadata.includes.push(include);
      }
    }
    metadata.outdatedIncludes = observable(metadata.outdatedIncludes.filter(include => !includes.includes(include)));
  }

  protected resetDataToDefault(): void {
    this.setData(this.defaultValue());
  }

  /**
   * Sets data to the resource. Forbidden to use outside of the loader or performUpdate functions!
   * @param data - new data
   * @returns {void}
   */
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
      metadata.outdatedIncludes = observable([...metadata.includes]);

      if (pageKey) {
        const from = pageKey.options.offset;
        const to = from + pageKey.options.limit;

        metadata.offsetPage?.pages.forEach(page => {
          if (page.isHasCommonSegment(from, to)) {
            page.setOutdated(true);
          }
        });
      } else {
        metadata.offsetPage?.pages.forEach(page => {
          page.setOutdated(true);
        });
      }
    });

    if (isResourceAlias(key)) {
      key = this.aliases.transformToKey(key);

      this.metadata.update(key, metadata => {
        metadata.outdated = true;
        metadata.outdatedIncludes = observable([...metadata.includes]);
        metadata.offsetPage?.pages.forEach(page => {
          page.setOutdated(true);
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

  protected abstract loader(param: ResourceKey<TKey>, include: ReadonlyArray<string> | undefined, refresh: boolean): TData | Promise<TData>;

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
   * Tip: use onDataOutdated executor with this function where it is needed.
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
            this.dataUpdate(key);
          }
        },
        // TODO: must rethink how to handle exceptions form performUpdate
        //       probably we need to handle this exceptions at the place
        //       where performUpdate is called
        //       because performUpdate is like an transaction
        // error: exception => {
        //   this.markOutdatedSync(key);
        //   this.markError(exception, key, include);
        // },
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
      const exception = this.getException(key);
      if (isContainsException(exception)) {
        throw getFirstException(exception);
      }

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
        success: () => {
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
      const key = this.outdateWaitList[i]!;
      this.markOutdatedSync(key);
    }
    this.outdateWaitList = [];
  }
}
