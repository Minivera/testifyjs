import chai from 'chai';
import sinon, { SinonSpy } from 'sinon';

import { suite } from '../lib';
import { Acter, Arranger, Asserter, ExecutionFunction } from '../lib/types';
import { Runner } from '../lib/runner';

const { expect } = chai;

suite('testing runner.ts', suite => {
    interface Input {
        testRunner: Runner;
        testSpy: SinonSpy;
    }

    const prepareRunner: ExecutionFunction<Input, Input> = () => ({
        testRunner: new Runner(),
        testSpy: sinon.spy(),
    });

    suite.test('arrange will prepare the runner and return a chain', test => {
        interface Output extends Input {
            result: Arranger;
        }

        test.arrange<Input, Input>(prepareRunner)
            .act<Input, Output>(({ testRunner, ...rest }) => {
                const result = testRunner.arrange(sinon.spy());
                return {
                    testRunner,
                    result,
                    ...rest,
                };
            })
            .assert<Output>(({ result }) => {
                expect(result.arrange).to.not.be.undefined;
                expect(result.and).to.not.be.undefined;
                expect(result.act).to.not.be.undefined;
                expect(result.assert).to.not.be.undefined;
            });
    });

    suite.test('act will prepare the runner and return a chain', test => {
        interface Output extends Input {
            result: Acter;
        }

        test.arrange<Input, Input>(prepareRunner)
            .act<Input, Output>(({ testRunner, ...rest }) => {
                const result = testRunner.act(sinon.spy());
                return {
                    testRunner,
                    result,
                    ...rest,
                };
            })
            .assert<Output>(({ result }) => {
                expect(result.and).to.not.be.undefined;
                expect(result.act).to.not.be.undefined;
                expect(result.assert).to.not.be.undefined;
            });
    });

    suite.test('assert will prepare the runner and return a chain', test => {
        interface Output extends Input {
            result: Asserter;
        }

        test.arrange<Input, Input>(prepareRunner)
            .act<Input, Output>(({ testRunner, ...rest }) => {
                const result = testRunner.assert(sinon.spy());
                return {
                    testRunner,
                    result,
                    ...rest,
                };
            })
            .assert<Output>(({ result }) => {
                expect(result.and).to.not.be.undefined;
                expect(result.assert).to.not.be.undefined;
            });
    });

    suite.test('Will execute then entire flow in order', test => {
        test.arrange<Input, Input>(prepareRunner)
            .act<Input>(async ({ testRunner, testSpy }) => {
                testRunner.arrange(testSpy).act(testSpy).assert(testSpy);
                await testRunner.run({});
            })
            .assert<Input>(({ testSpy }) => {
                expect(testSpy.calledThrice).to.be.true;
            });
    });
});
