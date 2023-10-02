import React from 'react';
import { Box, Static, Text } from 'ink';
import ms from 'ms';

import { LoggingState, SuiteState, TestState } from './logger.js';

interface TestData {
    id: number;
    order: number;
    paths: string[];
    status: string;
    messages: string[];
}

const getColorForStatus = (status: string): string | undefined => {
    switch (status) {
        case 'running':
            return 'yellow';
        case 'success':
            return 'green';
        case 'fail':
            return 'red';
        default:
            return undefined;
    }
};

const getIconForStatus = (status: string): string | undefined => {
    switch (status) {
        case 'running':
            return '⧗';
        case 'success':
            return '✓';
        case 'fail':
            return '✗';
        default:
            return undefined;
    }
};

interface TestProps {
    status: string;
    paths: string[];
    messages: string[];
}

const Test: React.FunctionComponent<TestProps> = ({ status, paths, messages }) => (
    <>
        <Box>
            <Text bold color={getColorForStatus(status)}>
                {getIconForStatus(status)}
            </Text>
            <Box marginLeft={1}>
                {paths.map((path, index, array) =>
                    index >= array.length - 1 ? (
                        <Text bold color={getColorForStatus(status)} key={index}>
                            {path}
                        </Text>
                    ) : (
                        <Text color={getColorForStatus(status)} key={index}>
                            {path}
                            {' -> '}
                        </Text>
                    )
                )}
            </Box>
        </Box>
        <Box marginLeft={4}>
            {messages.map((message, index) => (
                <Text color="red" key={index}>
                    {message.toString()}
                </Text>
            ))}
        </Box>
    </>
);

interface SummaryProps {
    suitesPassed: number;
    suitesFailed: number;
    testsPassed: number;
    testsFailed: number;
    time: string;
}

const Summary: React.FunctionComponent<SummaryProps> = ({
    suitesPassed,
    suitesFailed,
    testsPassed,
    testsFailed,
    time,
}) => (
    <Box flexDirection="column" marginTop={1}>
        <Box>
            <Box width={21}>
                <Text bold>Completed Suites:</Text>
            </Box>
            {suitesFailed > 0 && (
                <Text bold color="red">
                    {suitesFailed} failed,{' '}
                </Text>
            )}
            {suitesPassed > 0 && (
                <Text bold color="green">
                    {suitesPassed} passed,{' '}
                </Text>
            )}
            <Text>{suitesPassed + suitesFailed} total</Text>
        </Box>
        <Box>
            <Box width={21}>
                <Text bold>Completed Tests:</Text>
            </Box>
            {testsFailed > 0 && (
                <Text bold color="red">
                    {testsFailed} failed,{' '}
                </Text>
            )}
            {testsPassed > 0 && (
                <Text bold color="green">
                    {testsPassed} passed,{' '}
                </Text>
            )}
            <Text>{testsPassed + testsFailed} total</Text>
        </Box>
        <Box>
            <Box width={21}>
                <Text bold>Time:</Text>
            </Box>
            <Text>{time}</Text>
        </Box>
    </Box>
);

export interface TestRendererProps {
    state: LoggingState;
    startTime: Date;
}

export const TestRenderer: React.FunctionComponent<TestRendererProps> = ({ startTime, state }) => {
    const completedTests: TestData[] = [];
    const runningTests: TestData[] = [];

    let passedSuites = 0;
    let failedSuites = 0;
    let passedTests = 0;
    let failedTests = 0;

    const processSuite = (paths: string[], suite: SuiteState) => {
        if (suite.started && typeof suite.result !== 'undefined') {
            if (suite.result) {
                passedSuites++;
            } else {
                failedSuites++;
            }
        }

        suite.state.suites.forEach(suite => processSuite(paths.concat(suite.name), suite));
        suite.state.tests.forEach(test => processTest(paths.concat(test.name), test));
    };

    const processTest = (paths: string[], test: TestState) => {
        if (test.started && typeof test.result !== 'undefined') {
            completedTests.push({
                id: completedTests.length + 1,
                order: test.order,
                paths,
                status: !test.result ? 'fail' : 'success',
                messages: test.messages,
            });

            if (test.result) {
                passedTests++;
            } else {
                failedTests++;
            }
        } else if (test.started) {
            runningTests.push({
                id: runningTests.length + 1,
                order: test.order,
                paths,
                status: 'running',
                messages: test.messages,
            });
        }
    };

    state.suites.forEach(suite => processSuite([suite.name], suite));
    state.tests.forEach(test => processTest([test.name], test));

    return (
        <Box flexDirection="column">
            <Static items={completedTests.map(el => el).sort((el1, el2) => el1.order - el2.order)}>
                {test => <Test key={test.id} status={test.status} paths={test.paths} messages={test.messages} />}
            </Static>
            <Box>
                {runningTests.map(test => (
                    <Test key={test.id} status={test.status} paths={test.paths} messages={test.messages} />
                ))}
            </Box>
            <Summary
                suitesPassed={passedSuites}
                suitesFailed={failedSuites}
                testsPassed={passedTests}
                testsFailed={failedTests}
                time={ms(Date.now() - startTime.getTime())}
            />
        </Box>
    );
};
