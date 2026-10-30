export function syncHarnessHelp(select, helper) {
  helper.hidden = select.value !== "github";
}
