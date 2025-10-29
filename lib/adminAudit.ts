import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type AdminAuditLog = {
  actorUid: string; // who performed the action
  action: string; // e.g., 'course.publish', 'module.reorder', 'asset.add'
  resourceType: "course" | "module" | "asset" | "questionnaire" | "assignment";
  resourceId: string; // ID of the affected resource
  changes?: Record<string, { before: any; after: any }>; // optional change tracking
  ts: FieldValue; // serverTimestamp
};

/**
 * Centralized admin action logging for audit trail.
 * All admin mutations should call this to maintain compliance.
 */
export async function logAdminAction(
  db: FirebaseFirestore.Firestore,
  log: Omit<AdminAuditLog, "ts">
): Promise<void> {
  try {
    const auditLog: AdminAuditLog = {
      ...log,
      ts: FieldValue.serverTimestamp(),
    };

    await db.collection("adminAuditLogs").add(auditLog);

    console.log(
      `📋 Admin audit logged: ${log.action} by ${log.actorUid} on ${log.resourceType}:${log.resourceId}`
    );
  } catch (error) {
    console.error("❌ Failed to log admin action:", error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

/**
 * Helper to create change tracking object for updates
 */
export function trackChanges<T extends Record<string, any>>(
  before: T,
  after: T,
  fields: (keyof T)[]
): Record<string, { before: any; after: any }> {
  const changes: Record<string, { before: any; after: any }> = {};

  for (const field of fields) {
    if (before[field] !== after[field]) {
      changes[field as string] = {
        before: before[field],
        after: after[field],
      };
    }
  }

  return changes;
}
