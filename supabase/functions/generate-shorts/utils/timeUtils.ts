
// Utility functions for handling timestamps and time calculations

/**
 * Converts a timestamp string to seconds
 * @param timestamp String in MM:SS or HH:MM:SS format
 * @returns Number of seconds
 */
export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':');
  if (parts.length === 2) {
    // MM:SS format
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}

/**
 * Parse time range from timestamp (format: MM:SS-MM:SS or HH:MM:SS-HH:MM:SS)
 * @param timestamp Time range string
 * @returns Object with startTime and endTime in seconds
 */
export function parseTimeRange(timestamp: string): { startTime: number, endTime: number } {
  const parts = timestamp.split('-');
  if (parts.length !== 2) {
    return { startTime: 0, endTime: 30 }; // Default 30 seconds if invalid format
  }
  
  const startTime = timestampToSeconds(parts[0].trim());
  const endTime = timestampToSeconds(parts[1].trim());
  
  return { startTime, endTime };
}
