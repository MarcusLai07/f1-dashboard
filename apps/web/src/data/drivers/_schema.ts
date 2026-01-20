// Drivers TypeScript interfaces
// Unified driver data schema for F1 Dashboard

export interface DriverFull {
  code: string;
  number: number;
  firstName: string;
  lastName: string;
  teamId: string;
  country: string;      // ISO 3-letter code: "NED", "GBR"
  nationality: string;  // Full name: "Dutch", "British"
  flag: string;         // Emoji: "🇳🇱", "🇬🇧"
  imageUrl: string;
}

export interface DriversData {
  year: number;
  drivers: DriverFull[];
}

// F1 Media URL helper - used for building image URLs
export const F1_MEDIA_BASE = "https://media.formula1.com/image/upload/c_fill,g_face,w_320,h_320/q_auto/f_auto/common/f1/2026";

export function buildDriverImageUrl(team: string, code: string): string {
  return `${F1_MEDIA_BASE}/${team}/${code}/2026${team}${code}right.webp`;
}
