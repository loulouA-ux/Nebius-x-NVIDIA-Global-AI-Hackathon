import { ApiError } from "./http";

export function validateScanId(id: string): string {
  if (
    id.length !== 36 ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new ApiError(400, "Invalid scan ID.");
  return id;
}
