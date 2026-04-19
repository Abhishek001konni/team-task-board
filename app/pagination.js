export function pagingMeta(total, page, pageSize) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    total_pages: totalPages,
    has_next: page * pageSize < total,
    has_prev: page > 1,
  };
}
