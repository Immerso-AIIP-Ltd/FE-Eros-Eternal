/**
 * Stored after Soul Profile (`user_id`). Some screens use `userId`.
 */
export function getWellnessStoredUserId(): string | null {
  const raw =
    localStorage.getItem("user_id")?.trim() ||
    localStorage.getItem("userId")?.trim();
  return raw || null;
}
