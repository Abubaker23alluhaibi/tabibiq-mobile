// Debug utilities for troubleshooting the split error

export const debugSplitError = () => {
  console.log('=== Debug Split Error ===');
  
  // Test basic split operations
  try {
    const testString = 'test:value';
    const result = testString.split(':');
    console.log('Basic split test:', result);
  } catch (error) {
    console.error('Basic split test failed:', error);
  }
  
  // Test undefined split
  try {
    const undefinedValue: any = undefined;
    const result = undefinedValue?.split(':');
    console.log('Undefined split test:', result);
  } catch (error) {
    console.error('Undefined split test failed:', error);
  }
  
  // Test null split
  try {
    const nullValue: any = null;
    const result = nullValue?.split(':');
    console.log('Null split test:', result);
  } catch (error) {
    console.error('Null split test failed:', error);
  }
  
  // Test empty string split
  try {
    const emptyString = '';
    const result = emptyString.split(':');
    console.log('Empty string split test:', result);
  } catch (error) {
    console.error('Empty string split test failed:', error);
  }
};

export const safeSplit = (value: any, separator: string): string[] => {
  if (!value || typeof value !== 'string') {
    return [];
  }
  
  try {
    return value.split(separator);
  } catch (error) {
    console.error('Safe split error:', error);
    return [];
  }
};

export const safeFormatTime = (time: any): string => {
  if (!time || typeof time !== 'string') {
    return '';
  }
  
  try {
    const parts = time.split(':');
    if (parts.length < 2) {
      return time;
    }
    
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    
    if (isNaN(hours)) {
      return time;
    }
    
    const ampm = hours >= 12 ? 'م' : 'ص';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Safe format time error:', error);
    return time || '';
  }
};

export const safeGetInitials = (name: any): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  try {
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  } catch (error) {
    console.error('Safe get initials error:', error);
    return '';
  }
}; 