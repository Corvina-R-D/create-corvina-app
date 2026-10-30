const NUMBER_OF_PARALLEL_PROMISES = 5;

export interface IQueueHandlerOptions {
  numberOfParallelPromises?: number;
}

const fnWrapper = async (i: number | null, index: number, fn: () => unknown): Promise<number> => {
  const temp = i === null ? index : i;
  await fn();
  return temp;
};

/** runs the functions of the queue (emptying it), at most numberOfParallelPromises (default 5) at a time */
export const queueHandler = async (queue: Array<() => unknown>, options: IQueueHandlerOptions = {}): Promise<void> => {
  const { numberOfParallelPromises } = {
    numberOfParallelPromises: NUMBER_OF_PARALLEL_PROMISES,
    ...options,
  };

  if (numberOfParallelPromises <= 0 || Number.isNaN(numberOfParallelPromises))
    throw new Error(`not enough numberOfParallelPromises ${numberOfParallelPromises}`);

  const promises: Promise<number>[] = [];
  let i: number | null = 0;
  let index = 0;

  do {
    while (promises.length < numberOfParallelPromises && queue.length > 0) {
      // remove first element of queue
      const fn = queue.shift() as () => unknown;

      promises.splice(i === null ? index : i, 0, fnWrapper(i, index, fn));

      if (i !== null) {
        i += 1;
      }
    }
    // get index of the promise that endend first
    // eslint-disable-next-line no-await-in-loop
    index = await Promise.race(promises);

    promises.splice(index, 1);

    i = null;
  } while (queue.length > 0);

  await Promise.all(promises);
};
