// Kalis "Meeting K" mark (design/brand/logo/concept-1).
export const KMark = ({ size = 120 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect x="10" y="8" width="11" height="48" rx="3" fill="#101010" />
    <path d="M24 32 L44 9 L56 9 L36 32 Z" fill="#0038FF" />
    <path d="M24 32 L36 32 L56 55 L44 55 Z" fill="#0038FF" />
    <path d="M27 32.5 l3.2 3.4 l6.2-7.2" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
