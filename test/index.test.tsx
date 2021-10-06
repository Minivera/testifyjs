import React, { ReactElement, JSXElementConstructor } from 'react';
import chai from 'chai';
import sinon, { SinonSpiedInstance, SinonSpy } from 'sinon';
import { render } from 'ink-testing-library';

import { executions, suite as suiteFunc, test as testFunc, App } from '../lib';
import { ExecutionFunction, Suite, Test } from '../lib/types';
import { Logger } from '../lib/logger';

const { expect } = chai;

const sandbox = sinon.createSandbox();

suiteFunc('testing index.tsx', suite => {
    const prevExecutions = [...executions];
    const prevProcessExit = process.exit;

    suite.setup(() => {
        process.exit = sandbox.stub();
    });

    suite.beforeEach(() => {
        executions.splice(0);
    });

    suite.afterEach(() => {
        executions.splice(0);
        executions.push(...prevExecutions);
        sandbox.restore();
    });

    suite.tearDown(() => {
        process.exit = prevProcessExit;
    });

    suite.suite('suite', suite => {
        interface Input {
            name: string;
            testLogger: SinonSpiedInstance<Logger>;
            suiteSpy: sinon.SinonSpy;
        }

        interface Output extends Input {
            lastFrame: () => string | undefined;
            rerender: (tree: ReactElement<any, string | JSXElementConstructor<any>>) => void;
        }

        // eslint-disable-next-line @typescript-eslint/ban-types
        const setupSuite =
            (spyFunc: (suite: Suite) => void): ExecutionFunction<{}, Input> =>
            () => {
                const name = 'test';
                const suiteSpy = sandbox.spy(spyFunc);
                const suiteRunner = suiteFunc(name, suiteSpy);
                return {
                    name,
                    suiteSpy,
                    suiteRunner,
                    testLogger: sandbox.spy(new Logger()),
                };
            };

        const runSuite: ExecutionFunction<Input, Output> = async ({ testLogger, ...rest }) => {
            const { lastFrame, rerender } = render(
                <App logger={testLogger as unknown as Logger} startTime={new Date()} />
            );

            // Give some time to testify to resolve
            await new Promise(resolve => setTimeout(resolve, 100));

            return {
                ...rest,
                testLogger,
                lastFrame,
                rerender,
            };
        };

        suite.test('Will execute a test suite properly', test => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            test.arrange<{}, Input>(setupSuite(() => {}))
                .act<Input>(runSuite)
                .assert<Output>(({ name, suiteSpy, testLogger, lastFrame }) => {
                    expect(suiteSpy.called).to.be.true;

                    expect((testLogger.startSuite as SinonSpy).called).to.be.true;
                    let givenName = (testLogger.startSuite as SinonSpy).args[0];
                    expect(givenName).to.contain(name);

                    expect((testLogger.successSuite as SinonSpy).called).to.be.true;
                    givenName = (testLogger.successSuite as SinonSpy).args[0];
                    expect(givenName).to.contain(name);

                    expect(lastFrame()).to.contain(`Completed Suites:`);
                    expect(lastFrame()).to.contain(`1 passed`);
                    expect(lastFrame()).to.contain(`1 total`);
                    expect(lastFrame()).to.contain('Completed Tests:');
                    expect(lastFrame()).to.contain('0 total');
                });
        });

        suite.test("Will log the test's failure", test => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            test.arrange<{}, Input>(
                setupSuite(suite => {
                    suite.test('test', () => {
                        throw new Error('test');
                    });
                })
            )
                .act<Input>(runSuite)
                .assert<Output>(({ name, testLogger, lastFrame }) => {
                    expect((testLogger.errorSuite as SinonSpy).called).to.be.true;
                    const givenName = (testLogger.errorSuite as SinonSpy).args[0];
                    expect(givenName).to.contain(name);

                    expect(lastFrame()).to.contain(`Completed Suites:`);
                    expect(lastFrame()).to.contain(`1 failed`);
                    expect(lastFrame()).to.contain(`1 total`);
                    expect(lastFrame()).to.contain('Completed Tests:');
                    expect(lastFrame()).to.contain('0 total');
                });
        });
    });

    suite.suite('test', suite => {
        interface Input {
            name: string;
            testLogger: SinonSpiedInstance<Logger>;
            testSpy: sinon.SinonSpy;
        }

        interface Output extends Input {
            lastFrame: () => string | undefined;
            rerender: (tree: ReactElement<any, string | JSXElementConstructor<any>>) => void;
        }

        // eslint-disable-next-line @typescript-eslint/ban-types
        const setupTest =
            (spyFunc: (test: Test) => void): ExecutionFunction<{}, Input> =>
            () => {
                const name = 'test';
                const testSpy = sandbox.spy(spyFunc);
                const testRunner = testFunc(name, testSpy);
                return {
                    name,
                    testSpy,
                    testRunner,
                    testLogger: sandbox.spy(new Logger()),
                };
            };

        const runTest: ExecutionFunction<Input, Output> = async ({ testLogger, ...rest }) => {
            const { lastFrame, rerender } = render(
                <App logger={testLogger as unknown as Logger} startTime={new Date()} />
            );

            // Give some time to testify to resolve
            await new Promise(resolve => setTimeout(resolve, 100));

            return {
                ...rest,
                testLogger,
                lastFrame,
                rerender,
            };
        };

        suite.test('Will execute a test suite properly', test => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            test.arrange<{}, Input>(setupTest(() => {}))
                .act<Input>(runTest)
                .assert<Output>(({ name, testSpy, testLogger, lastFrame }) => {
                    expect(testSpy.called).to.be.true;

                    expect((testLogger.startTest as SinonSpy).called).to.be.true;
                    let givenName = (testLogger.startTest as SinonSpy).args[0];
                    expect(givenName).to.contain(name);

                    expect((testLogger.successTest as SinonSpy).called).to.be.true;
                    givenName = (testLogger.successTest as SinonSpy).args[0];
                    expect(givenName).to.contain(name);

                    expect(lastFrame()).to.contain(`Completed Tests:`);
                    expect(lastFrame()).to.contain(`1 passed`);
                    expect(lastFrame()).to.contain(`1 total`);
                });
        });

        suite.test("Will log the test's failure", test => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            test.arrange<{}, Input>(
                setupTest(test => {
                    test.assert(() => {
                        throw new Error('test');
                    });
                })
            )
                .act<Input>(runTest)
                .assert<Output>(({ name, testLogger, lastFrame }) => {
                    expect((testLogger.errorTest as SinonSpy).called).to.be.true;
                    const givenName = (testLogger.errorTest as SinonSpy).args[0];
                    expect(givenName).to.contain(name);

                    expect(lastFrame()).to.contain(`Completed Tests:`);
                    expect(lastFrame()).to.contain(`1 failed`);
                    expect(lastFrame()).to.contain(`1 total`);
                });
        });
    });
});
