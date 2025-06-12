import { Mutex } from 'async-mutex';
import type { ITableSource } from './interfaces/ITableSource.js';
import { createNanoEvents, type Emitter, type Unsubscribe } from 'nanoevents';
import type { TableSourceEvents } from './interfaces/TableSourceEvents.js';
import type { ITableDatasetManager } from './interfaces/ITableDatasetManager.js';
import type { ITableSourceOptions } from './interfaces/ITableSourceOptions.js';

export abstract class TableSource<TColumn, TValue, TOptions extends ITableSourceOptions = ITableSourceOptions>
  implements ITableSource<TColumn, TValue, TOptions>
{
  get isLoading(): boolean {
    return this.#loadingInProgress;
  }
  get isOutdated(): boolean {
    return this.#outdated;
  }
  error: Error | null;
  options: Partial<TOptions>;

  #outdated: boolean;
  #loadingInProgress = false;
  #loadingPending = false;
  readonly #mutex: Mutex;
  readonly #emitter: Emitter<TableSourceEvents>;
  constructor(readonly datasetManager: ITableDatasetManager<TColumn, TValue>) {
    this.options = {};
    this.error = null;
    this.#outdated = false;
    this.#mutex = new Mutex();
    this.#emitter = createNanoEvents();
  }

  setOptions(options: TOptions): void {
    this.options = options;
    this.setOutdated();
  }

  setOutdated(): void {
    this.setOutdatedValue(true);
    if (this.#mutex.isLocked()) {
      this.#mutex.runExclusive(() => {
        this.setOutdatedValue(true);
      });
    }
  }

  async save(): Promise<void> {
    const release = await this.#mutex.acquire();
    try {
      this.setError(null);
      await this.saveData();
      this.emit('saved');
    } catch (error) {
      this.setError(error instanceof Error ? error : new Error(String(error)));
      throw this.error;
    } finally {
      release();
    }
  }

  async load(): Promise<void> {
    if (this.#loadingInProgress) {
      this.#loadingPending = true;
      return await this.#mutex.waitForUnlock();
    }
    this.setLoadingInProgress(true);
    try {
      // this waits for any save to finish, then runs loadData
      await this.#mutex.runExclusive(async () => {
        do {
          this.#loadingPending = false;
          this.setError(null);
          await this.loadData();
          this.emit('data');
        } while (this.#loadingPending);
      });
    } catch (error) {
      this.setError(error instanceof Error ? error : new Error(String(error)));
      throw this.error;
    } finally {
      this.setOutdatedValue(false);
      this.setLoadingInProgress(false);
    }
  }

  on<TEvent extends keyof TableSourceEvents>(event: TEvent, listener: TableSourceEvents[TEvent]): Unsubscribe {
    return this.#emitter.on(event, listener);
  }

  protected setLoadingInProgress(state: boolean): void {
    this.emit('loading', state);
    this.#loadingInProgress = state;
  }

  protected setError(error: Error | null): void {
    this.error = error;
    this.emit('error', error);
  }

  protected setOutdatedValue(state: boolean): void {
    this.#outdated = state;
    this.emit('outdated', state);
  }

  protected emit<TEvent extends keyof TableSourceEvents>(event: TEvent, ...args: Parameters<TableSourceEvents[TEvent]>): void {
    this.#emitter.emit(event, ...args);
  }
  protected abstract saveData(): Promise<void>;
  protected abstract loadData(): Promise<void>;
}
