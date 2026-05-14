import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.locals.errorMessage = err.message;
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err instanceof ValidationError && { errors: err.errors }),
    });
  }

  console.error("Unexpected Error:", err);
  res.locals.errorMessage = "Internal server error";
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
