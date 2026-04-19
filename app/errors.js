export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Shortcut functions so we don't repeat ourselves in every router
export function notFound(resource) {
  return new AppError(404, "not_found", `${resource} not found.`);
}

export function conflict(code, message) {
  return new AppError(409, code, message);
}

export function unprocessable(code, message) {
  return new AppError(422, code, message);
}

export function badRequest(code, message) {
  return new AppError(400, code, message);
}

// Turns an error into a proper JSON response the client can read
export function errorResponse(err) {
  if (err instanceof AppError) {
    return Response.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }
  console.error(err);
  return Response.json(
    { error: { code: "internal_error", message: "Something went wrong." } },
    { status: 500 },
  );
}
