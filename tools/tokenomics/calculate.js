export function sizeFor(credits, planning) {
  return planning.sizes.find((size) => size.below === null || credits < size.below);
}

export function buyGuidanceFor(size) {
  return {
    text: ["S", "M"].includes(size.name)
      ? "Pay-as-you-go with budget alerts. Set a monthly budget and alert at 80%."
      : "P3 pre-purchase plan with pay-as-you-go overflow. Size the P3 tier from the likely monthly credits × 12, and let pay-as-you-go cover spikes above the pool.",
    why: "Consumption-first: start on pay-as-you-go while usage is small or uncertain; once volume is predictable at L/XL, a P3 pool lowers the effective rate and pay-as-you-go absorbs overflow."
  };
}

export function estimate({ users, runs, band, factor, measured = null, widening = 1 }) {
  const volume = users * runs;
  if (measured !== null) {
    const total = volume * measured;
    return { low: total, likely: total, high: total, measured: true };
  }
  return {
    low: volume * band.low * factor.low / widening,
    likely: volume * band.likely * factor.likely,
    high: volume * band.high * factor.high * widening,
    measured: false
  };
}

export function price(credits, rates, months) {
  const payg = credits * rates.payg.value;
  const annualDemand = credits * months;
  const options = rates.p3.value.map((tier) => ({
    ...tier,
    cost: (tier.credits * rates.payg.value * (1 - tier.discount)
      + Math.max(0, annualDemand - tier.credits) * rates.payg.value) / months
  }));
  const p3 = options.reduce((best, option) => option.cost < best.cost ? option : best);
  return { payg, p3 };
}
