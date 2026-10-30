export function harnessRatePresentation(entry, rates, formatNumber) {
  const rate = typeof entry.value === "string" ? rates[entry.value] : null;
  if (!rate || !["low", "likely", "high"].every((key) => Number.isFinite(rate[key]))) return null;
  return {
    value: `${formatNumber(rate.low)}–${formatNumber(rate.high)}× (likely ${formatNumber(rate.likely)}×)`,
    unit: rate.unit
  };
}

export function syncHarnessHelp(select, helper) {
  helper.hidden = select.value !== "github";
}
