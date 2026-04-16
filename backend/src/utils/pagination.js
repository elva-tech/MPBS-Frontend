const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

function toPositiveInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i > 0 ? i : null;
}

export function getPagination(query = {}) {
  const page = toPositiveInt(query.page);
  const limit = toPositiveInt(query.limit);

  if (!page && !limit) {
    return { enabled: false, page: 1, limit: DEFAULT_LIMIT, skip: 0 };
  }

  const finalPage = page || 1;
  const finalLimit = Math.min(limit || DEFAULT_LIMIT, MAX_LIMIT);
  return {
    enabled: true,
    page: finalPage,
    limit: finalLimit,
    skip: (finalPage - 1) * finalLimit,
  };
}

export function makePaginationMeta(total, page, limit) {
  const totalItems = Number(total) || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
