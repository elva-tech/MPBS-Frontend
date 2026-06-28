/** Stroke-style sidebar icons (matches society Complaints nav). */
const iconClass = "h-4 w-4 shrink-0";

export const ModuleNavIcons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 3h7v4h-7v-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v2H2v-2Zm13 0a5 5 0 0 1 10 0v2H15v-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  requests: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 12h10M8 16h10M8 8h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  notifications: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  milk: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M12 2c3.3 0 6 2.7 6 6 0 2.6-1.7 4.8-4 5.6V22H10v-8.4C7.7 12.8 6 10.6 6 8c0-3.3 2.7-6 6-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  truck: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M3 6h11v9H3V6Zm11 3h3.6l3.4 3.9V15h-7V9Zm-8 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  report: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  complaint: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M4 4h16v14H8l-4 4V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  collection: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M6 2h12M6 22h12M8 2v6l4 4 4-4V2M8 22v-6l4-4 4 4v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  billing: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  payments: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  schemes: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M12 2l3 7h7l-5.5 4 2 7L12 17l-5.5 4 2-7L2 9h7l3-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  claims: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  invoice: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8l-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  route: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="5" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 19h5a4 4 0 0 0 4-4V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  tanker: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <rect x="2" y="7" width="15" height="10" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M17 11h3l3 3v3h-6v-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  receipt: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M4 4h16v14H8l-4 4V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  products: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  inventory: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  dispatch: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  audit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function NavIcon({ name }) {
  return ModuleNavIcons[name] || ModuleNavIcons.report;
}
