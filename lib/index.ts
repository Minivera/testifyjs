import { Suite, Test } from './types';
import { Runner } from './runner';
import { SuiteRunner } from './suite';
import { logger } from './logger';

export const executions: (() => Promise<boolean>)[] = [];

export const test = (name: string, func: (starter: Test) => Promise<void> | void): void => {
    executions.push(async (): Promise<boolean> => {
        logger.start(name);

        const starter = new Runner();

        await func(starter);
        const passed = await starter.run({});

        if (passed) {
            logger.success(name);
            return true;
        } else {
            logger.error(name);
            return false;
        }
    });
};

export const suite = (name: string, func: (starter: Suite) => Promise<void> | void): void => {
    executions.push(async (): Promise<boolean> => {
        logger.start(name);

        const starter = new SuiteRunner(name);

        await func(starter);
        const passed = await starter.run();

        if (passed) {
            logger.success(name);
            return true;
        } else {
            logger.error(name);
            return false;
        }
    });
};

export const testify = async (): Promise<void> => {
    logger.start('Executing the tests');
    let passedCount = 0;

    for (const execution of executions) {
        const result = await execution();
        if (result) {
            passedCount += 1;
        }
    }

    // TODO: Improve this to give more information to the users
    if (passedCount === executions.length) {
        logger.success(`${passedCount} out of ${executions.length} tests and suites passed`);
    } else {
        logger.error(`${passedCount} out of ${executions.length} tests and suites passed`);
        process.exit(1);
    }
};
