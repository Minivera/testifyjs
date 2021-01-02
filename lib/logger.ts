import consola from 'consola';

export const logger = {
    start: (message: string): void => consola.start(message),
    info: (message: string): void => consola.info(message),
    success: (message: string): void => consola.success(message),
    error: (message: string): void => consola.error(message),
    fatal: (message: string): void => consola.fatal(message),
};
