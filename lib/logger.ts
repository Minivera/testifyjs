import consola from 'consola';

export const logger = {
    start: (message: string): void => consola.start(message),
    success: (message: string): void => consola.success(message),
    error: (message: string): void => consola.error(message),
    fatal: (message: string): void => consola.fatal(message),
};
