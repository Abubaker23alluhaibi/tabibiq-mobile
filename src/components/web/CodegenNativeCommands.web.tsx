// Web-specific replacement for react-native/Libraries/Utilities/codegenNativeCommands
// This module is not available on web, so we provide a mock implementation

export const codegenNativeCommands = () => {
  // Return empty object for web compatibility
  return {};
};

export default codegenNativeCommands;




