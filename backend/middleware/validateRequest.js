import ApiError from '../utils/ApiError.js';
export const validateRequest = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(new ApiError(400, 'Validation failed.', result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))));
  req.validated ??= {}; req.validated[source] = result.data; next();
};
export const validateId = (req, res, next, value) => /^[a-f\d]{24}$/i.test(value) ? next() : next(new ApiError(400, 'Invalid resource ID.'));
