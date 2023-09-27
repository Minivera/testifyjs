import React, { useState, useEffect } from 'react';
import { render } from 'ink';

import { Suite, Test } from './types.js';
import { Runner } from './runner.js';
import { SuiteRunner } from './suite.js';
import { Logger } from './logger.js';
import { TestRenderer } from './renderer.js';

export const executions: ((logger: Logger) => Promise<boolean>)[] = [];

export const test = (name: string, func: (starter: Test) => Promise<void> | void): void => {
    executions.push(async (logger: Logger): Promise<boolean> => {
        logger.startTest(name);

        const starter = new Runner(name);

        await func(starter);
        const passed = await starter.run(logger, {});

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
    executions.push(async (logger: Logger): Promise<boolean> => {
        logger.startSuite(name);

        const starter = new SuiteRunner(name, []);

        await func(starter);
        const passed = await starter.run(logger);

        if (passed) {
            logger.successSuite(name);
            return true;
        } else {
            logger.errorSuite(name);
            return false;
        }
    });
};

interface AppProps {
    startTime: Date;
    logger: Logger;
}

export const App: React.FunctionComponent<AppProps> = ({ logger, startTime }) => {
    const [currentState, setCurrentState] = useState(logger.state);
    const [, setTime] = useState(new Date());

    useEffect(() => {
        (async () => {
            logger.setSubscriber(state => {
                setCurrentState(state);
                setTime(new Date());
            });

            let anyFailed = false;
            try {
                for (const execution of executions) {
                    const result = await execution(logger);
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

        return () => {
            logger.clearSubscriber();
        };
    }, []);

    return <TestRenderer state={currentState} startTime={startTime} />;
};

export const testify = (): void => {
    const startTime = new Date();
    const logger = new Logger();

    render(<App logger={logger} startTime={startTime} />);
};
