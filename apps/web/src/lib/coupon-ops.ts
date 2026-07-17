export function canDeleteCoupon(usageCount: number): boolean {
  return usageCount === 0;
}

export function canChangeDiscount(usageCount: number): boolean {
  return usageCount === 0;
}
