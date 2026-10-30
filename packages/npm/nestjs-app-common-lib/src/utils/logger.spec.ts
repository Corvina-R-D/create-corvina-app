import { Writable } from 'stream';
import pino from 'pino';
import { getLoggerOptions } from './logger';

describe('Logger options', () => {
  it('logs the message and the stack of an error in err and error', () => {
    const lines: any[] = [];
    const stream = new Writable({
      write(chunk, _, callback) {
        lines.push(JSON.parse(chunk.toString()));
        callback();
      },
    });
    const logger = pino(getLoggerOptions(), stream);

    logger.warn({ msg: 'failed', error: new Error('boom') });
    logger.error({ err: new TypeError('bang') });

    expect(lines[0].error).toMatchObject({ type: 'Error', message: 'boom' });
    expect(lines[0].error.stack).toContain('Error: boom');
    expect(lines[1].err).toMatchObject({ type: 'TypeError', message: 'bang' });
  });
});
