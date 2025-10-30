/**
 * Centralized date formatting utilities
 * Handles both Firestore Timestamps and regular dates consistently
 */

// Type definitions for various timestamp formats
interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds?: number;
}

interface FirestoreTimestampWithToDate {
  toDate(): Date;
}

interface LegacyTimestamp {
  seconds: number;
}

type TimestampLike =
  | FirestoreTimestamp
  | FirestoreTimestampWithToDate
  | LegacyTimestamp
  | Date
  | string
  | null
  | undefined;

/**
 * Convert various timestamp formats to a Date object
 */
export function toDate(timestamp: TimestampLike): Date | null {
  if (!timestamp) return null;

  // Handle Firestore Timestamp with _seconds and _nanoseconds (from API)
  if (
    typeof timestamp === "object" &&
    timestamp !== null &&
    "_seconds" in timestamp &&
    typeof (timestamp as FirestoreTimestamp)._seconds === "number"
  ) {
    const firestoreTimestamp = timestamp as FirestoreTimestamp;
    const seconds = firestoreTimestamp._seconds;
    const nanoseconds = firestoreTimestamp._nanoseconds || 0;
    return new Date(seconds * 1000 + nanoseconds / 1000000);
  }

  // Handle Firestore Timestamp with toDate method (from Firestore SDK)
  if (
    typeof timestamp === "object" &&
    timestamp !== null &&
    "toDate" in timestamp &&
    typeof (timestamp as FirestoreTimestampWithToDate).toDate === "function"
  ) {
    return (timestamp as FirestoreTimestampWithToDate).toDate();
  }

  // Handle timestamp with seconds property (legacy format)
  if (
    typeof timestamp === "object" &&
    timestamp !== null &&
    "seconds" in timestamp &&
    typeof (timestamp as LegacyTimestamp).seconds === "number"
  ) {
    return new Date((timestamp as LegacyTimestamp).seconds * 1000);
  }

  // Handle Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // Handle string dates
  if (typeof timestamp === "string") {
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/**
 * Format date in a consistent, readable format
 * @param timestamp - Any timestamp-like value
 * @param options - Intl.DateTimeFormatOptions for customization
 */
export function formatDate(
  timestamp: TimestampLike,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  const date = toDate(timestamp);
  if (!date) return "Not set";

  return date.toLocaleDateString("en-US", options);
}

/**
 * Format date with time
 */
export function formatDateTime(timestamp: TimestampLike): string {
  const date = toDate(timestamp);
  if (!date) return "Not set";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format date in short format (e.g., "Jan 15, 2024")
 */
export function formatDateShort(timestamp: TimestampLike): string {
  const date = toDate(timestamp);
  if (!date) return "Not set";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date for API responses (ISO string)
 */
export function formatDateISO(timestamp: TimestampLike): string | null {
  const date = toDate(timestamp);
  return date?.toISOString() || null;
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(timestamp: TimestampLike): string {
  const date = toDate(timestamp);
  if (!date) return "Unknown";

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  } else if (diffInHours > 0) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  } else if (diffInMinutes > 0) {
    return diffInMinutes === 1
      ? "1 minute ago"
      : `${diffInMinutes} minutes ago`;
  } else {
    return "Just now";
  }
}

/**
 * Format duration (for course/module duration)
 */
export function formatDuration(hours: number | undefined): string {
  if (!hours) return "Not specified";

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  const wholeHours = Math.floor(hours);
  const remainingMinutes = Math.round((hours - wholeHours) * 60);

  if (remainingMinutes === 0) {
    return `${wholeHours} ${wholeHours === 1 ? "hour" : "hours"}`;
  }

  return `${wholeHours}h ${remainingMinutes}m`;
}

/**
 * Format level string (capitalize first letter)
 */
export function formatLevel(level: string | undefined): string {
  if (!level) return "Not specified";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Check if a date is today
 */
export function isToday(timestamp: TimestampLike): boolean {
  const date = toDate(timestamp);
  if (!date) return false;

  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is within the last N days
 */
export function isWithinDays(timestamp: TimestampLike, days: number): boolean {
  const date = toDate(timestamp);
  if (!date) return false;

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  return diffInDays <= days;
}
