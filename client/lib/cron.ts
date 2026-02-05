import cronstrue from "cronstrue/i18n";

export function cron(expression: string, locale: string) {
  const desc = cronstrue.toString(expression, {
    locale: locale,
    use24HourTimeFormat: true,
  });

  return desc;
}
