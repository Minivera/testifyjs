import chai from 'chai';
import sinon, { SinonSpy } from 'sinon';

import { suite } from '../lib';
import { ExecutionFunction } from '../lib/types';
import { SuiteRunner } from '../lib/suite';

const { expect } = chai;

suite('testing suite.ts', suite => {
    interface Input {
        testRunner: SuiteRunner;
        testSpy: SinonSpy;
    }

    const prepareRunner: ExecutionFunction<Input, Input> = () => ({
        testRunner: new SuiteRunner('test'),
        testSpy: sinon.spy(),
    });

    const addSetup: ExecutionFunction<Input> = ({ testRunner, testSpy }) => {
        const result = testRunner.setup(testSpy);
        return {
            testRunner,
            result,
            testSpy,
        };
    };

    const addTeadown: ExecutionFunction<Input> = ({ testRunner, testSpy }) => {
        const result = testRunner.tearDown(testSpy);
        return {
            testRunner,
            result,
            testSpy,
        };
    };

    const addBeforeEach: ExecutionFunction<Input> = ({ testRunner, testSpy }) => {
        const result = testRunner.beforeEach(testSpy);
        return {
            testRunner,
            result,
            testSpy,
        };
    };

    const addAfterEach: ExecutionFunction<Input> = ({ testRunner, testSpy }) => {
        const result = testRunner.afterEach(testSpy);
        return {
            testRunner,
            result,
            testSpy,
        };
    };

    const addTest: ExecutionFunction<Input> = async ({ testRunner }) => {
        testRunner.test('test', sinon.spy());
    };

    const executeRunner: ExecutionFunction<Input> = async ({ testRunner }) => {
        await testRunner.run();
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
});
