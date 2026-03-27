import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid UUID format");

export function validateUUID(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }

  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }

  return result.data;
}

export function validateOptionalUUID(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }

  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }

  return result.data;
}

export function parseUUIDParam(value: unknown, fieldName: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw createParamError(fieldName, result.error.errors[0]?.message ?? "Invalid format");
  }

  return result.data;
}

export function createParamError(fieldName: string, message: string): Error {
  const error = new Error(`${fieldName}: ${message}`);
  (error as Error & { code: string }).code = "INVALID_PARAM";
  return error;
}
