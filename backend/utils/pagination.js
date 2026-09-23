export const pagination = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.ceil(totalItems / limit),
  hasNextPage: page * limit < totalItems,
  hasPreviousPage: page > 1,
});
export async function listPage(
  Model,
  filter,
  query,
  sort = { createdAt: -1 },
  populate,
) {
  const { page, limit } = query;
  let cursor = Model.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  if (populate) cursor = cursor.populate(populate);
  const [data, total] = await Promise.all([
    cursor,
    Model.countDocuments(filter),
  ]);
  return { data, pagination: pagination(page, limit, total) };
}
export const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
