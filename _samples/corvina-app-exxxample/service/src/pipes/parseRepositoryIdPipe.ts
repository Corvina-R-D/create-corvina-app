import { ParseUUIDPipe } from '@nestjs/common';
import { CustomError } from '../utils/CustomError';

export const ParseRepositoryIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => {
    return new CustomError(302, 'Invalid request: repositoryId is not a valid UUID v4');
  },
});
