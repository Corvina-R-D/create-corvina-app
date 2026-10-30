import { PaginatedDto } from './paginated.dto';

/** PaginatedDto of a sequelize findAndCountAll page */
export const mapToPaginatedResponse = <TData>(input: { rows: TData[]; count: number; pageSize: number; page: number }): PaginatedDto<TData> => {
  const { rows, count, pageSize, page } = input;

  return {
    content: rows,
    totalPages: Math.ceil(count / pageSize),
    totalElements: count,
    last: (page + 1) * pageSize >= count,
    number: page,
    size: pageSize,
  };
};
