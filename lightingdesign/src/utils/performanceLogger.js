/**
 * Performance logging utility for React components
 * Helps identify re-render causes and performance bottlenecks
 */

let isEnabled = false;

// Enable/disable logging globally
export const enablePerformanceLogging = () => {
  isEnabled = true;
  console.log('%c[Performance Logging Enabled]', 'color: #4CAF50; font-weight: bold;');
};

export const disablePerformanceLogging = () => {
  isEnabled = false;
  console.log('%c[Performance Logging Disabled]', 'color: #F44336; font-weight: bold;');
};

// Check if logging is enabled
export const isPerformanceLoggingEnabled = () => isEnabled;

/**
 * Log component render with timing
 */
export const logRender = (componentName, props = {}) => {
  if (!isEnabled) return;
  
  const timestamp = new Date().toISOString().split('T')[1];
  console.log(
    `%c[Render] ${componentName} @ ${timestamp}`,
    'color: #2196F3; font-weight: bold;',
    props
  );
};

/**
 * Log prop changes that triggered re-render
 */
export const logPropChanges = (componentName, prevProps, currentProps) => {
  if (!isEnabled) return;
  
  const changes = {};
  const allKeys = new Set([...Object.keys(prevProps || {}), ...Object.keys(currentProps || {})]);
  
  allKeys.forEach(key => {
    if (prevProps?.[key] !== currentProps?.[key]) {
      changes[key] = {
        prev: prevProps?.[key],
        current: currentProps?.[key]
      };
    }
  });
  
  if (Object.keys(changes).length > 0) {
    console.log(
      `%c[Props Changed] ${componentName}`,
      'color: #FF9800; font-weight: bold;',
      changes
    );
  }
};

/**
 * Create a performance monitor hook
 */
export const usePerformanceMonitor = (componentName, props, deps = []) => {
  if (typeof window === 'undefined') return;
  if (!isEnabled) return;
  
  const React = require('react');
  const renderCount = React.useRef(0);
  const prevProps = React.useRef(props);
  const renderStart = React.useRef(performance.now());
  
  React.useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now() - renderStart.current;
    
    console.log(
      `%c[Render #${renderCount.current}] ${componentName} (${renderTime.toFixed(2)}ms)`,
      'color: #9C27B0; font-weight: bold;'
    );
    
    logPropChanges(componentName, prevProps.current, props);
    prevProps.current = props;
    
    renderStart.current = performance.now();
  });
  
  React.useEffect(() => {
    console.log(
      `%c[Effect Triggered] ${componentName}`,
      'color: #00BCD4; font-weight: bold;',
      'Dependencies changed'
    );
  }, deps);
};

/**
 * Measure execution time of a function
 */
export const measurePerformance = (label, fn) => {
  if (!isEnabled) return fn();
  
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  console.log(
    `%c[Performance] ${label}: ${duration.toFixed(2)}ms`,
    'color: #4CAF50; font-weight: bold;'
  );
  
  return result;
};

/**
 * Log expensive operations
 */
export const logExpensiveOperation = (operationName, details = {}) => {
  if (!isEnabled) return;
  
  console.warn(
    `%c[Expensive Operation] ${operationName}`,
    'color: #FF5722; font-weight: bold;',
    details
  );
};

/**
 * Memory snapshot logger
 */
export const logMemoryUsage = (label) => {
  if (!isEnabled || !performance.memory) return;
  
  const memory = performance.memory;
  console.log(
    `%c[Memory] ${label}`,
    'color: #607D8B; font-weight: bold;',
    {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    }
  );
};
