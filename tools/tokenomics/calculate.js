export function sizeFor(credits, planning) {
  return planning.sizes.find((size) => size.below === null || credits < size.below);
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
  const packs = Math.ceil(credits / rates.pack.value);
  const annualDemand = credits * months;
  const options = rates.p3.value.map((tier) => ({
    ...tier,
    cost: (tier.credits * rates.payg.value * (1 - tier.discount)
      + Math.max(0, annualDemand - tier.credits) * rates.payg.value) / months
  }));
  const p3 = options.reduce((best, option) => option.cost < best.cost ? option : best);
  return { payg, packs, packEquivalent: packs * rates.pack.value * rates.payg.value, p3 };
}
