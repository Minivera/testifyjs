import React, { useState, useEffect } from 'react';

import { Suite, Test } from './types';
import { Runner } from './runner';
import { SuiteRunner } from './suite';
import { loggingState, logger } from './logger';
import { TestRenderer } from './renderer';
import { render } from 'ink';

export const executions: (() => Promise<boolean>)[] = [];

export const test = (name: string, func: (starter: Test) => Promise<void> | void): void => {
    executions.push(async (): Promise<boolean> => {
        logger.startTest(name);

        const starter = new Runner(name);

        await func(starter);
        const passed = await starter.run({});

        if (passed) {
            logger.successTest(name);
            return true;
        } else {
            logger.errorTest(name);
            return false;
        }
    });
};

export const suite = (name: string, func: (starter: Suite) => Promise<void> | void): void => {
    executions.push(async (): Promise<boolean> => {
        logger.startSuite(name);

        const starter = new SuiteRunner(name, []);

        await func(starter);
        const passed = await starter.run();

        if (passed) {
            logger.successSuite(name);
            return true;
        } else {
            logger.errorSuite(name);
            return false;
        }
    });
};

export const testify = (): void => {
    const startTime = new Date();

    const App: React.FunctionComponent = () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, setTime] = useState(new Date());

        useEffect(() => {
            (async () => {
                let anyFailed = false;
                try {
                    for (const execution of executions) {
                        const result = await execution();
                        if (!result) {
                            anyFailed = true;
                        }
                    }
                } catch (e) {
                    console.error(e);
                    process.exit(1);
                }

                process.exit(anyFailed ? 1 : 0);
            })();

            const timer = setInterval(() => {
                setTime(new Date());
            }, 100);

            return () => {
                clearInterval(timer);
            };
        });

        return <TestRenderer state={loggingState} startTime={startTime} />;
    };

    render(<App />);
};
