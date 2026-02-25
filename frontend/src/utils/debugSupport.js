/**
 * Debug logging utility for support chat feature
 * Logs to console and localStorage for production debugging
 */

const DEBUG_KEY = 'support_debug_logs';
const MAX_LOGS = 100;

const debugLevels = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SOCKET: 'SOCKET',
  API: 'API'
};

export const debugSupport = {
  /**
   * Log a debug message
   * @param {string} level - Log level (INFO, SUCCESS, WARNING, ERROR, SOCKET, API)
   * @param {string} message - Main message
   * @param {object} data - Additional data to log
   */
  log: (level, message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      userAgent: navigator.userAgent.substring(0, 50)
    };

    // Log to console with styling
    const styles = {
      INFO: 'color: blue; font-weight: bold',
      SUCCESS: 'color: green; font-weight: bold',
      WARNING: 'color: orange; font-weight: bold',
      ERROR: 'color: red; font-weight: bold',
      SOCKET: 'color: purple; font-weight: bold',
      API: 'color: teal; font-weight: bold'
    };

    console.log(`%c[SUPPORT ${level}] ${message}`, styles[level], data);

    // Store in localStorage
    try {
      let logs = JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]');
      logs.push(logEntry);

      // Keep only last 100 logs
      if (logs.length > MAX_LOGS) {
        logs = logs.slice(-MAX_LOGS);
      }

      localStorage.setItem(DEBUG_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to store debug log:', e);
    }
  },

  /**
   * Log info message
   */
  info: (message, data) => {
    debugSupport.log(debugLevels.INFO, message, data);
  },

  /**
   * Log success message
   */
  success: (message, data) => {
    debugSupport.log(debugLevels.SUCCESS, message, data);
  },

  /**
   * Log warning message
   */
  warning: (message, data) => {
    debugSupport.log(debugLevels.WARNING, message, data);
  },

  /**
   * Log error message
   */
  error: (message, data) => {
    debugSupport.log(debugLevels.ERROR, message, data);
  },

  /**
   * Log socket event
   */
  socket: (message, data) => {
    debugSupport.log(debugLevels.SOCKET, message, data);
  },

  /**
   * Log API call
   */
  api: (message, data) => {
    debugSupport.log(debugLevels.API, message, data);
  },

  /**
   * Get all stored logs
   */
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]');
    } catch (e) {
      console.error('Failed to retrieve debug logs:', e);
      return [];
    }
  },

  /**
   * Export logs as JSON file
   */
  exportLogs: () => {
    const logs = debugSupport.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `support-debug-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Clear all logs
   */
  clearLogs: () => {
    localStorage.removeItem(DEBUG_KEY);
    console.log('%c[SUPPORT] Debug logs cleared', 'color: gray; font-weight: bold');
  },

  /**
   * Print summary of logs
   */
  summary: () => {
    const logs = debugSupport.getLogs();
    const counts = {};
    logs.forEach((log) => {
      counts[log.level] = (counts[log.level] || 0) + 1;
    });

    console.table(counts);
    console.log(`Total logs: ${logs.length}`);
  },

  /**
   * Filter logs by level or message
   */
  filter: (predicate) => {
    const logs = debugSupport.getLogs();
    return logs.filter(predicate);
  }
};

/**
 * Get debug logs from localStorage and format for display
 * Usage in console: window.__SUPPORT_DEBUG_LOGS()
 */
if (typeof window !== 'undefined') {
  window.__SUPPORT_DEBUG_LOGS = () => {
    const logs = debugSupport.getLogs();
    console.table(logs.map(log => ({
      Time: new Date(log.timestamp).toLocaleTimeString(),
      Level: log.level,
      Message: log.message,
      Details: JSON.stringify(log.data)
    })));
  };

  window.__EXPORT_SUPPORT_LOGS = () => {
    debugSupport.exportLogs();
  };

  window.__CLEAR_SUPPORT_LOGS = () => {
    debugSupport.clearLogs();
  };

  console.log('%cSupport Debug Tools Loaded', 'color: green; font-weight: bold');
  console.log('Available commands:');
  console.log('  window.__SUPPORT_DEBUG_LOGS() - Show all debug logs');
  console.log('  window.__EXPORT_SUPPORT_LOGS() - Export logs as JSON');
  console.log('  window.__CLEAR_SUPPORT_LOGS() - Clear all logs');
}

export default debugSupport;
