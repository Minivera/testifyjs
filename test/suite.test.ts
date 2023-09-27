import chai from 'chai';
import sinon, { SinonSpiedInstance, SinonSpy } from 'sinon';

import { suite } from '../lib/index.js';
import { ExecutionFunction } from '../lib/types.js';
import { SuiteRunner } from '../lib/suite.js';
import { Logger } from '../lib/logger.js';

const { expect } = chai;

suite('testing suite.ts', suite => {
    interface Input {
        testLogger: SinonSpiedInstance<Logger>;
        testRunner: SuiteRunner;
        testSpy: SinonSpy;
    }

    interface Output {
        testLogger: SinonSpiedInstance<Logger>;
        testRunner: SuiteRunner;
        testSpy: SinonSpy;
        result: boolean;
    }

    const prepareRunner: ExecutionFunction<Input, Input> = () => ({
        testRunner: new SuiteRunner('test', []),
        testSpy: sinon.spy(),
        testLogger: sinon.spy(new Logger()),
    });

    const addSetup: ExecutionFunction<Input> = ({ testRunner, testSpy, ...rest }) => {
        testRunner.setup(testSpy);
        return {
            testRunner,
            testSpy,
            ...rest,
        };
    };

    const addTeadown: ExecutionFunction<Input> = ({ testRunner, testSpy, ...rest }) => {
        testRunner.tearDown(testSpy);
        return {
            testRunner,
            testSpy,
            ...rest,
        };
    };

    const addBeforeEach: ExecutionFunction<Input> = ({ testRunner, testSpy, ...rest }) => {
        testRunner.beforeEach(testSpy);
        return {
            testRunner,
            testSpy,
            ...rest,
        };
    };

    const addAfterEach: ExecutionFunction<Input> = ({ testRunner, testSpy, ...rest }) => {
        testRunner.afterEach(testSpy);
        return {
            testRunner,
            testSpy,
            ...rest,
        };
    };

    const addTest: ExecutionFunction<Input> = ({ testRunner }) => {
        testRunner.test('test', sinon.spy());
    };

    const executeRunner: ExecutionFunction<Input, Output> = async ({ testRunner, testLogger, ...rest }) => {
        testLogger.startSuite('test');

        const result = await testRunner.run(testLogger as unknown as Logger);
        return {
            ...rest,
            testRunner,
            result,
            testLogger,
        };
    };

    suite.test('setup will add a setup function', test => {
        test.arrange<Input, Input>(prepareRunner)
            .act<Input>(addSetup)
            .act<Input>(executeRunner)
            .assert<Input>(({ testSpy }) => {
                expect(testSpy.called).to.be.true;
            });
    });

    suite.test('tearDown will add a tearDown function', test => {
        test.arrange<Input, Input>(prepareRunner)
            .arrange<Input>(addTeadown)
            .act<Input>(executeRunner)
            .assert<Input>(({ testSpy }) => {
                expect(testSpy.called).to.be.true;
            });
    });

    suite.test('beforeEach will add a beforeEach function', test => {
        test.arrange<Input, Input>(prepareRunner)
            .arrange<Input>(addBeforeEach)
            .arrange<Input>(addTest)
            .act<Input>(executeRunner)
            .assert<Input>(({ testSpy }) => {
                expect(testSpy.called).to.be.true;
            });
    });

    suite.test('afterEach will add a afterEach function', test => {
        test.arrange<Input, Input>(prepareRunner)
            .arrange<Input>(addAfterEach)
            .arrange<Input>(addTest)
            .act<Input>(executeRunner)
            .assert<Input>(({ testSpy }) => {
                expect(testSpy.called).to.be.true;
            });
    });

    suite.test('Will execute then entire flow in order', test => {
        test.arrange<Input, Input>(prepareRunner)
            .arrange<Input>(addSetup)
            .arrange<Input>(addTeadown)
            .arrange<Input>(addBeforeEach)
            .arrange<Input>(addAfterEach)
            .arrange<Input>(addTest)
            .act<Input>(executeRunner)
            .assert<Input>(({ testSpy }) => {
                expect(testSpy.callCount).to.equal(4);
            });
    });

    suite.test('Will fail on a test failure', test => {
        test.arrange<Input, Input>(prepareRunner)
            .arrange<Input>(({ testRunner }) => {
                testRunner.test('test', test => {
                    test.assert(() => {
                        throw new Error('test');
                    });
                });
            })
            .act<Input, Output>(executeRunner)
            .assert<Output>(({ result }) => {
                expect(result).to.be.false;
            });
    });

    suite.test('Will fail on a hook failure', test => {
        test.arrange<Input, Input>(prepareRunner)
            .arrange<Input>(addTest)
            .arrange<Input>(({ testRunner, ...rest }) => {
                testRunner.beforeEach(() => {
                    throw new Error('test');
                });
                return {
                    ...rest,
                    testRunner,
                };
            })
            .act<Input, Output>(executeRunner)
            .assert<Output>(({ result }) => {
                expect(result).to.be.false;
            });
    });

    suite.suite('on a subsuite', suite => {
        suite.test('Will execute then entire flow in order', test => {
            test.arrange<Input, Input>(prepareRunner)
                .arrange<Input>(({ testRunner, testSpy }) => {
                    testRunner.suite('test-suite', suite => {
                        suite.test('test', testSpy);
                    });
                })
                .act<Input, Output>(executeRunner)
                .assert<Output>(({ testSpy, result }) => {
                    expect(result).to.be.true;
                    expect(testSpy.callCount).to.equal(1);
                });
        });

        suite.test('Will fail on a test failure', test => {
            test.arrange<Input, Input>(prepareRunner)
                .arrange<Input>(({ testRunner }) => {
                    testRunner.suite('test-suite', suite => {
                        suite.test('test', test => {
                            test.assert(() => {
                                throw new Error('test');
                            });
                        });
                    });
                })
                .act<Input, Output>(executeRunner)
                .assert<Output>(({ result }) => {
                    expect(result).to.be.false;
                });
        });

        suite.test('Will fail on a hook failure', test => {
            test.arrange<Input, Input>(prepareRunner)
                .arrange<Input>(addTest)
                .arrange<Input>(({ testRunner, ...rest }) => {
                    testRunner.beforeEach(() => {
                        throw new Error('test');
                    });
                    return {
                        ...rest,
                        testRunner,
                    };
                })
                .arrange<Input>(({ testRunner, ...rest }) => {
                    testRunner.suite('test-suite', sinon.spy());
                    return {
                        ...rest,
                        testRunner,
                    };
                })
                .act<Input, Output>(executeRunner)
                .assert<Output>(({ result }) => {
                    expect(result).to.be.false;
                });
        });
    });
});
