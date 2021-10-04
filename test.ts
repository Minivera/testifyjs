import { testify, test, suite } from './lib';

// import './test/index.test';
// import './test/runner.test';
// import './test/suite.test';

test('lone test, default suite', test => {
    test.assert(() => {
        console.log('lone test');
    });
});

suite('root suite', suite => {
    suite.test('root suite test', test => {
        test.assert(() => {
            console.log('root suite test');
        });
    });

    suite.suite('nested suite', suite => {
        suite.test('nested suite test', test => {
            test.assert(() => {
                console.log('nested suite test');
            });
        });
    });
});

testify();
