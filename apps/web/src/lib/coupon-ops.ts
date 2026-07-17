export function canDeleteCoupon(usageCount: number): boolean {
  return usageCount === 0;
}

export function canChangeDiscount(_usageCount: number): boolean {
  return true;
}
