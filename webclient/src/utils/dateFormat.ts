/**
 * Date formatting utilities for events
 */

export interface FormattedEventDate {
  day: number;
  monthShort: string;
  dateString: string;
  timeString: string;
  endDateString: string | null;
  endTimeString: string | null;
}

/**
 * Format event dates with German locale and Berlin timezone
 * @param dateStart Event start date
 * @param dateEnd Event end date (optional, can be null)
 * @returns Formatted date object
 */
export function formatEventDate(dateStart: string, dateEnd?: string | null): FormattedEventDate {
  const startDate = new Date(dateStart);
  
  const day = startDate.getDate();
  const month = startDate.toLocaleString("de-DE", { 
    month: "short",
    timeZone: "Europe/Berlin"
  }).toUpperCase();
  const monthShort = month.endsWith(".") ? month : month + ".";

  const timeString = startDate.toLocaleString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin"
  });

  const dateString = startDate.toLocaleDateString("de-DE", {
    timeZone: "Europe/Berlin"
  });

  let endTimeString: string | null = null;
  let endDateString: string | null = null;

  if (dateEnd) {
    const endDate = new Date(dateEnd);
    endTimeString = endDate.toLocaleString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin"
    });
    endDateString = endDate.toLocaleDateString("de-DE", {
      timeZone: "Europe/Berlin"
    });
  }

  return {
    day,
    monthShort,
    dateString,
    timeString,
    endDateString,
    endTimeString,
  };
}

/**
 * Format distance in kilometers or meters
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
