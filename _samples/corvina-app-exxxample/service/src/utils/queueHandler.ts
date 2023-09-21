const NUMBER_OF_PARALLEL_PROMISES = 5;

export interface IQueueHandlerOptions {
  numberOfParallelPromises?: number;
}

const fnWrapper = async (i: number | null, index: number, fn: Function) => {
  const temp = i === null ? index : i;
  await fn();
  return temp;
};

export const queueHandler = async (queue: Array<Function>, options: IQueueHandlerOptions) => {
  const { numberOfParallelPromises } = {
    numberOfParallelPromises: NUMBER_OF_PARALLEL_PROMISES,
    ...options,
  };

  if (numberOfParallelPromises <= 0 || Number.isNaN(numberOfParallelPromises))
    throw new Error(`not enough numberOfParallelPromises ${numberOfParallelPromises}`);

  const promises = [];
  let i = 0;
  let index;

  do {
    while (promises.length < numberOfParallelPromises && queue.length > 0) {
      // remove first element of queue
      const fn = queue.shift();

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
