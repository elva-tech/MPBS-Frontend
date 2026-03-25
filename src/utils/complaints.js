function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

export function filterComplaintsForPortal(items, { role, userId, username }) {
  const normalizedRole = normalizeValue(role);
  const normalizedUserId = normalizeValue(userId);
  const normalizedUsername = normalizeValue(username);

  return (items || []).filter((item) => {
    if (normalizeValue(item?.type) !== "complaint") return false;
    if (normalizedRole && normalizeValue(item?.role) !== normalizedRole) return false;

    if (normalizedUserId && normalizeValue(item?.userId) === normalizedUserId) {
      return true;
    }

    if (normalizedUsername && normalizeValue(item?.username) === normalizedUsername) {
      return true;
    }

    return false;
  });
}

export function getComplaintSubmitterName(item) {
  const submittedName = String(item?.societyName || "").trim();
  const accountName = String(item?.username || "").trim();

  if (
    submittedName &&
    accountName &&
    submittedName.toLowerCase() !== accountName.toLowerCase()
  ) {
    return `${submittedName} (${accountName})`;
  }

  return submittedName || accountName || "N/A";
}
