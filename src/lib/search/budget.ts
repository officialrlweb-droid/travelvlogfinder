export interface SpendBreakdown {
  perPersonPerDay: number;
  stayPerDay: number;
  foodPerDay: number;
  localTravelPerDay: number;
  travelers: number;
  groupTotalPerDay: number;
  sharedRoomBudgetPerNight: number;
  sharedLocalTravelPerDay: number;
}

/**
 * Splits a Kerala daily travel budget (stay, food, local travel — excluding transit to destination)
 * into realistic category estimates and shared group pools when traveling with 2+ people.
 */
export function calculateSpendBreakdown(
  perDayBudget: number,
  travelersInput = 1
): SpendBreakdown {
  const travelers = Math.max(1, Math.min(20, Math.floor(travelersInput || 1)));
  const perPersonPerDay = Math.round(perDayBudget);

  // Typical Kerala trip allocation: Stay ~48%, Food ~28%, Local travel ~24%
  const stayPerDay = Math.round((perPersonPerDay * 0.48) / 50) * 50;
  const foodPerDay = Math.round((perPersonPerDay * 0.28) / 50) * 50;
  const localTravelPerDay = Math.max(0, perPersonPerDay - stayPerDay - foodPerDay);

  const groupTotalPerDay = perPersonPerDay * travelers;
  // Shared rooms typically fit 2-3 per room; shared cab/jeep pools across up to 4 per vehicle
  const sharedRoomBudgetPerNight = stayPerDay * Math.min(travelers, 3);
  const sharedLocalTravelPerDay = localTravelPerDay * Math.min(travelers, 4);

  return {
    perPersonPerDay,
    stayPerDay,
    foodPerDay,
    localTravelPerDay,
    travelers,
    groupTotalPerDay,
    sharedRoomBudgetPerNight,
    sharedLocalTravelPerDay,
  };
}
