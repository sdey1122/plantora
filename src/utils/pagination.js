// Parse pagination query parameters
const pagination = (query = {}) => {
  const defaultPageSize = Number(process.env.DEFAULT_PAGE_SIZE) || 10;

  const maxPageSize = Number(process.env.MAX_PAGE_SIZE) || 100;

  let page = Number.parseInt(query.page, 10) || 1;

  let limit = Number.parseInt(query.limit, 10) || defaultPageSize;

  if (page < 1) {
    page = 1;
  }

  if (limit < 1) {
    limit = defaultPageSize;
  }

  if (limit > maxPageSize) {
    limit = maxPageSize;
  }

  const skip = (page - 1) * limit;

  const buildPagination = (totalDocuments) => {
    const totalPages = Math.ceil(totalDocuments / limit);

    return {
      currentPage: page,

      totalPages,

      totalDocuments,

      limit,

      hasPreviousPage: page > 1,

      hasNextPage: page < totalPages,
    };
  };

  return {
    page,

    limit,

    skip,

    buildPagination,
  };
};

// Export utility
module.exports = pagination;
