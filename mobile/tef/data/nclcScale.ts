// SayBon — TEF Canada NCLC Scale (SINGLE SOURCE OF TRUTH)
//
// No NCLC threshold may be hardcoded anywhere outside this file.
// Every screen that displays a band must import BAND_THRESHOLDS from here
// and must check NCLC_SCALE_LAST_VERIFIED before rendering a number without
// the "unverified scale" notice.

export const NCLC_SCALE_SOURCE =
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html';

// ⚠ UNVERIFIED. The thresholds below are a working draft written from memory
// and MUST be checked against the IRCC page above before any release build.
// Users make immigration decisions on these numbers — do not flip this to a
// date until a human has actually confirmed each row against the source.
export const NCLC_SCALE_LAST_VERIFIED: string | null = null;

export type TefModuleKey = 'CE' | 'CO' | 'EE' | 'EO';

export interface NclcBandRow {
  nclc: number;
  CE: [number, number]; // out of 300
  CO: [number, number]; // out of 360
  EE: [number, number]; // out of 450
  EO: [number, number]; // out of 450
}

// Working draft — see the warning above.
export const BAND_THRESHOLDS: NclcBandRow[] = [
  { nclc: 10, CE: [263, 300], CO: [316, 360], EE: [393, 450], EO: [393, 450] },
  { nclc: 9, CE: [248, 262], CO: [298, 315], EE: [371, 392], EO: [371, 392] },
  { nclc: 8, CE: [233, 247], CO: [280, 297], EE: [349, 370], EO: [349, 370] },
  { nclc: 7, CE: [207, 232], CO: [249, 279], EE: [310, 348], EO: [310, 348] },
  { nclc: 6, CE: [181, 206], CO: [217, 248], EE: [271, 309], EO: [271, 309] },
  { nclc: 5, CE: [151, 180], CO: [181, 216], EE: [226, 270], EO: [226, 270] },
  { nclc: 4, CE: [121, 150], CO: [145, 180], EE: [181, 225], EO: [181, 225] },
];

export const MIN_NCLC = 4;
export const MAX_NCLC = 10;

export function isNclcScaleVerified(): boolean {
  return NCLC_SCALE_LAST_VERIFIED !== null;
}

export function nclcRowFor(nclc: number): NclcBandRow | undefined {
  return BAND_THRESHOLDS.find((row) => row.nclc === nclc);
}
