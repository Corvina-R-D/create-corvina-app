import { CustomError } from './CustomError';

export const getOffsetAndLimit = ({ offset, limit }: { offset?: number; limit?: number }): { offset: number; limit: number } => {
  const _offset = offset ?? 0;
  const _limit = limit ?? 10;

  if (_limit <= 0) {
    throw new CustomError(201, 'Limit must be greater than 0');
  }

  if (_limit > 1000) {
    throw new CustomError(202, 'Limit cannot be greater than 1000');
  }

  return { offset: _offset, limit: _limit };
};
