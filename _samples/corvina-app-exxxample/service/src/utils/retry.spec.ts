import { retry } from './retry';

it('success with 3 retries', async () => {
  const fn = async () => 1;

  await retry(fn, { nRetries: 3, ms: 1000 });
});

it('fail after 3 retries', async () => {
  const fn = async () => {
    throw new Error('testing...');
  };
  let err = null;

  try {
    await retry(fn, { nRetries: 3, ms: 10 });
  } catch (error) {
    err = error;
  }

  expect(err).not.toBeNull();
  expect(err.message).toBe('retry fn: Failed retrying too many attempts');
});

it('success with 0 retries', async () => {
  const fn = async () => 1;
  let err = null;

  try {
    await retry(fn, { nRetries: 0, ms: 1000 });
  } catch (error) {
    err = error;
  }

  expect(err).not.toBeNull();
  expect(err.message).toBe('retry fn: Failed retrying too many attempts');
});

it('handle error and stop retrying', async () => {
  const fn = async () => {
    throw new Error('testing...');
  };

  try {
    await retry(fn, {
      nRetries: 3,
      ms: 10,
      handleError: (nRetries: number, err: Error) => {
        expect(nRetries).toBe(3);
        expect(err.message).toBe('testing...');
        return { continue: false };
      },
    });
  } catch (error) {
    // original error is thrown
    expect(error.message).toBe('testing...');
  }
});

it('handle error, stop retrying and avoid error rethrow', async () => {
  const fn = async () => {
    throw new Error('testing...');
  };

  await retry(fn, {
    nRetries: 3,
    ms: 10,
    handleError: (nRetries: number, err: Error) => {
      expect(nRetries).toBe(3);
      expect(err.message).toBe('testing...');
      return { continue: false, avoidRethrow: true };
    },
  });
});
