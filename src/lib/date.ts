const EVENT_TIMEZONE = "America/Sao_Paulo";

/** Retorna a data (AAAA-MM-DD) no fuso horário do evento, para checkins diários. */
export function todayInEventTimezone(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIMEZONE }).format(
    date,
  );
}
