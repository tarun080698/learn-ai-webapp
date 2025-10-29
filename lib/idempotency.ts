import { firestore } from "firebase-admin";

type Scope = {
  kind: "enroll" | "progress" | "response";
  uid: string;
  courseId?: string;
  moduleId?: string;
  assignmentId?: string;
};

/**
 * Wraps idempotent operations with deduplication via idempotentWrites collection.
 * If the key already exists, returns the stored result.
 * Otherwise, executes the function and stores the result.
 */
export async function withIdempotency<T>(
  db: FirebaseFirestore.Firestore,
  key: string | undefined,
  scope: Scope,
  fn: () => Promise<T>
): Promise<T> {
  if (!key) {
    throw new Error("Missing x-idempotency-key header");
  }

  const ref = db.collection("idempotentWrites").doc(key);

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    if (snap.exists) {
      const stored = snap.get("result") as T | undefined;
      if (stored !== undefined) {
        console.log(
          `🔄 Idempotent operation returned cached result for key: ${key}`
        );
        return stored;
      }
      // If exists but no result, treat as in-progress; could throw conflict or return cached result
    }

    console.log(`⚡ Executing idempotent operation for key: ${key}`);
    const result = await fn();

    tx.set(ref, {
      key,
      scope,
      result,
      ts: firestore.FieldValue.serverTimestamp(),
      // TTL handled via Cloud Function/scheduled task elsewhere
    });

    return result;
  });
}
