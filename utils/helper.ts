export function formatDate(dateIso: string): string {
  const date = new Date(dateIso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function calculateCompletionRate(
  completed: number,
  enrolled: number
): number {
  if (enrolled === 0) return 0;
  return Math.round((completed / enrolled) * 100);
}
