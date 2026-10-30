import { setTimeout } from 'timers/promises';
import { queueHandler } from './queueHandler';

const DELTA_ERROR = 0.05; // 5% (I added this constant to avoid flaky tests)

it('With numberOfParallelPromises=3, should execute only 3 promises at the same time', async () => {
  const startTime = Date.now();

  await queueHandler([() => setTimeout(100), () => setTimeout(100), () => setTimeout(100), () => setTimeout(100), () => setTimeout(100)], {
    numberOfParallelPromises: 3,
  });

  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(200 * (1 + DELTA_ERROR));
});

it('A long promise does not blocks the others', async () => {
  const startTime = Date.now();

  await queueHandler([() => setTimeout(500), () => setTimeout(50), () => setTimeout(50), () => setTimeout(50), () => setTimeout(50)], {
    numberOfParallelPromises: 3,
  });

  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(500 * (1 + DELTA_ERROR));
});
