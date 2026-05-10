export const QUALITY_MIN_FAT = 3.5;
export const QUALITY_MIN_SNF = 8.5;

export function isGoodQualityByThreshold({ fat, snf } = {}) {
  const fatValue = Number(fat);
  const snfValue = Number(snf);
  return Number.isFinite(fatValue) && Number.isFinite(snfValue) && fatValue >= QUALITY_MIN_FAT && snfValue >= QUALITY_MIN_SNF;
}

