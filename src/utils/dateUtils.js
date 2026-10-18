/**
 * School Timezone: Asia/Kolkata (IST = UTC+05:30)
 * Provides consistent date conversion and formatting across admin exam scheduling and list views.
 */

export const SCHOOL_TIMEZONE = 'Asia/Kolkata';
export const IST_OFFSET = '+05:30';

/**
 * Converts a datetime-local input string (YYYY-MM-DDTHH:mm) entered in IST into a UTC ISO string.
 * If already an ISO string with timezone or Date object, standardizes to UTC ISO.
 * @param {string|Date|null|undefined} inputValue
 * @returns {string|null} ISO-8601 UTC string (e.g. "2026-10-18T14:00:00.000Z") or null
 */
export function toUtcIsoString(inputValue) {
    if (!inputValue) return null;
    if (inputValue instanceof Date) {
        return isNaN(inputValue.getTime()) ? null : inputValue.toISOString();
    }

    const str = String(inputValue).trim();
    if (!str) return null;

    // If input already has a timezone indicator (Z or +/-HH:mm offset)
    if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) {
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d.toISOString();
    }

    // Match YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
        const [, year, month, day, hour, minute, second = '00'] = match;
        const isoWithOffset = `${year}-${month}-${day}T${hour}:${minute}:${second}${IST_OFFSET}`;
        const d = new Date(isoWithOffset);
        return isNaN(d.getTime()) ? null : d.toISOString();
    }

    // Fallback attempt
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Converts a UTC ISO date string into a local YYYY-MM-DDTHH:mm string in Asia/Kolkata (IST)
 * suitable for binding to an HTML5 <input type="datetime-local" /> element.
 * @param {string|Date|null|undefined} utcDateInput
 * @returns {string} String in "YYYY-MM-DDTHH:mm" format or empty string
 */
export function toLocalDatetimeInputString(utcDateInput) {
    if (!utcDateInput) return '';
    const date = new Date(utcDateInput);
    if (isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: SCHOOL_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);

    const map = {};
    for (const p of parts) {
        map[p.type] = p.value;
    }

    let hour = map.hour || '00';
    if (hour === '24') hour = '00';

    return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

/**
 * Formats a date for the Exam Card in Asia/Kolkata (IST) timezone.
 * @param {string|Date|null|undefined} dateInput
 * @returns {{ day: string, dayName: string, time: string }}
 */
export function formatExamCardDate(dateInput) {
    if (!dateInput) return { day: '--', dayName: '--', time: '--' };
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return { day: '--', dayName: '--', time: '--' };

    const dayFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: SCHOOL_TIMEZONE,
        day: 'numeric'
    });
    const weekdayFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: SCHOOL_TIMEZONE,
        weekday: 'short'
    });
    const timeFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: SCHOOL_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return {
        day: dayFormatter.format(date),
        dayName: weekdayFormatter.format(date),
        time: timeFormatter.format(date)
    };
}

/**
 * Formats a date into a "Month Year" grouping key in Asia/Kolkata (IST) timezone.
 * @param {string|Date|null|undefined} dateInput
 * @returns {string} e.g. "October 2026"
 */
export function formatExamMonthYear(dateInput) {
    if (!dateInput) return 'Unscheduled';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Unscheduled';

    const monthYearFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: SCHOOL_TIMEZONE,
        month: 'long',
        year: 'numeric'
    });

    return monthYearFormatter.format(date);
}
