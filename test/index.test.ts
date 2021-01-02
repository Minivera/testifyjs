import chai from 'chai';
import sinon, { SinonSpy } from 'sinon';
import consola from 'consola';

import { executions, suite as suiteFunc, test as testFunc, testify } from '../lib';
import { ExecutionFunction, Suite, Test } from '../lib/types';

const { expect } = chai;

suiteFunc('testing index.ts', suite => {
    const prevExecutions = [...executions];

    suite.setup(() => {
        consola.wrapAll();
    });

    suite.beforeEach(() => {
        executions.splice(0);
        consola.mockTypes(typeName => sinon.spy(message => console.log(`${typeName} ${message}`)));
    });

    suite.afterEach(() => {
        executions.splice(0);
        executions.push(...prevExecutions);
    });

    suite.suite('suite', suite => {
        interface Input {
            name: string;
            suiteSpy: sinon.SinonSpy;
        }

        // eslint-disable-next-line @typescript-eslint/ban-types
        const setupSuite = (spyFunc: (suite: Suite) => void): ExecutionFunction<{}, Input> => () => {
            const name = 'test';
            const suiteSpy = sinon.spy(spyFunc);
            const suiteRunner = suiteFunc(name, suiteSpy);
            return {
                name,
                suiteSpy,
                suiteRunner,
            };
        };

        const runSuite: ExecutionFunction<Input> = async () => {
            await testify();
        };

        suite.test('Will execute a test suite properly', test => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            test.arrange<{}, Input>(setupSuite(() => {}))
                .act<Input>(runSuite)
                .assert<Input>(({ name, suiteSpy }) => {
                    expect(suiteSpy.called).to.be.true;

                    const consolaMessages = (consola.start as SinonSpy).args.map(c => c[0]);
                    expect(consolaMessages.find(message => message.includes(name))).to.include(name);
                });
        });

        suite.test("Will log the test's success", test => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            test.arrange<{}, Input>(
                setupSuite(suite => {
                    suite.test('test', () => {});
                })
            )
                .act<Input>(runSuite)
                .assert<Input>(({ name }) => {
                    const consolaMessages = (consola.success as SinonSpy).args.map(c => c[0]);
                    expect(consolaMessages.find(message => message.includes(name))).to.include(name);
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
                .assert<Input>(({ name }) => {
                    const consolaMessages = (consola.error as SinonSpy).args.map(c => c[0]);
                    expect(consolaMessages.find(message => message.includes(name))).to.include(name);
                });
        });
    });

    suite.suite('test', suite => {
        interface Input {
            name: string;
            testSpy: sinon.SinonSpy;
        }

        // eslint-disable-next-line @typescript-eslint/ban-types
        const setupTest = (spyFunc: (test: Test) => void): ExecutionFunction<{}, Input> => () => {
            const name = 'test';
            const testSpy = sinon.spy(spyFunc);
            const testRunner = testFunc(name, testSpy);
            return {
                name,
                testSpy,
                testRunner,
            };
        };

        const runTest: ExecutionFunction<Input> = async () => {
            await testify();
        };

        suite.test('Will execute a test suite properly', test => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            test.arrange<{}, Input>(setupTest(() => {}))
                .act<Input>(runTest)
                .assert<Input>(({ name, testSpy }) => {
                    expect(testSpy.called).to.be.true;

                    const consolaMessages = (consola.start as SinonSpy).args.map(c => c[0]);
                    expect(consolaMessages.find(message => message.includes(name))).to.include(name);
                });
        });

        suite.test("Will log the test's success", test => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            test.arrange<{}, Input>(setupTest(() => {}))
                .act<Input>(runTest)
                .assert<Input>(({ name }) => {
                    const consolaMessages = (consola.success as SinonSpy).args.map(c => c[0]);
                    expect(consolaMessages.find(message => message.includes(name))).to.include(name);
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
                .assert<Input>(({ name }) => {
                    const consolaMessages = (consola.error as SinonSpy).args.map(c => c[0]);
                    expect(consolaMessages.find(message => message.includes(name))).to.include(name);
                });
        });
    });
});
