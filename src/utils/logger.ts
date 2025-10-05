/**
 * نظام Logging مبسط للإنتاج
 * معطل تماماً في الإنتاج لتحسين الأداء
 */

// دوال logging فارغة للإنتاج
export const logError = (message: string, data?: any): void => {
  // Logging disabled in production
};

export const logWarn = (message: string, data?: any): void => {
  // Logging disabled in production
};

export const logInfo = (message: string, data?: any): void => {
  // Logging disabled in production
};

export const logDebug = (message: string, data?: any): void => {
  // Logging disabled in production
};

export const logApiCall = (endpoint: string, method: string, data?: any): void => {
  // Logging disabled in production
};

export const logApiResponse = (endpoint: string, status: number): void => {
  // Logging disabled in production
};

export const logNotificationEvent = (event: string, data?: any): void => {
  // Logging disabled in production
};

export const logUserAction = (action: string, data?: any): void => {
  // Logging disabled in production
};

export const logger = {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  userAction: logUserAction,
  apiCall: logApiCall,
  apiResponse: logApiResponse,
  notification: logNotificationEvent
};

