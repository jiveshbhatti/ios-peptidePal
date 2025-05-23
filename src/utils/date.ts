// Simple date utilities without any external dependencies

/**
 * Format a date as a string in the given format
 */
export function formatDate(date: Date | string, formatString = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();
  
  // Handle the most common patterns in order
  let result = formatString;
  
  // Year
  result = result.replace('yyyy', year.toString());
  result = result.replace('yy', year.toString().slice(-2));
  
  // Month
  result = result.replace('MMMM', months[month]);
  result = result.replace('MMM', shortMonths[month]);
  result = result.replace('MM', (month + 1).toString().padStart(2, '0'));
  result = result.replace('M', (month + 1).toString());
  
  // Day
  result = result.replace('dd', day.toString().padStart(2, '0'));
  result = result.replace('d', day.toString());
  
  return result;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return false;
  }
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get all dates in a given month
 */
export function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const dates: Date[] = [];
  const daysInMonth = lastDay.getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(new Date(year, month, i));
  }
  
  return dates;
}

/**
 * Get a time string from a date (e.g., "3:30 PM")
 */
export function getTimeString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Get a day abbreviation (e.g., "Mon")
 */
export function getDayAbbreviation(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

/**
 * Get a month and year string (e.g., "January 2023")
 */
export function getMonthYear(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Get dates for a week containing the given date
 */
export function getWeekDates(date: Date): Date[] {
  const day = date.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = date.getDate() - day;
  
  const sunday = new Date(date);
  sunday.setDate(diff);
  
  const dates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(sunday);
    currentDate.setDate(sunday.getDate() + i);
    dates.push(currentDate);
  }
  
  return dates;
}