import { v4 as uuidv4 } from "uuid";

// Client-safe UUID generation for idempotency keys
export function generateIdempotencyKey(): string {
  return uuidv4();
}
