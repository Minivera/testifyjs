import React from 'react';
import { Box, Static, Text } from 'ink';
import ms from 'ms';

import { LoggingState, SuiteState, TestState } from './logger';

interface TestData {
    id: number;
    order: number;
    paths: string[];
    status: string;
    messages: string[];
}

const getBackgroundForStatus = (status: string): string | undefined => {
    switch (status) {
        case 'runs':
            return 'yellow';
        case 'pass':
            return 'green';
        case 'fail':
            return 'red';
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
    <Box>
        <Text color="black" backgroundColor={getBackgroundForStatus(status)}>
            {` ${status.toUpperCase()} `}
        </Text>
        <Box marginLeft={1}>
            {paths.map((path, index, array) =>
                index >= array.length - 1 ? (
                    <Text bold color="white" key={index}>
                        {path}
                    </Text>
                ) : (
                    <Text dimColor key={index}>
                        {path}
                        {' -> '}
                    </Text>
                )
            )}
        </Box>
        <Box marginLeft={1}>
            {messages.map(message => (
                <Text color="black" backgroundColor="red">
                    {message}
                </Text>
            ))}
        </Box>
    </Box>
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
                <Text bold>Test Suites (Tests):</Text>
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
            <Text>{suitesPassed + suitesFailed} total (</Text>
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
            <Text>{testsPassed + testsFailed} total)</Text>
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

    let passedSuites = 0;
    let failedSuites = 0;
    let passedTests = 0;
    let failedTests = 0;

    const processSuite = (paths: string[], suite: SuiteState) => {
        if (suite.started && typeof suite.result !== 'undefined') {
            completedTests.push({
                id: completedTests.length + 1,
                order: suite.order,
                paths,
                status: !suite.result ? 'fail' : 'success',
                messages: suite.messages,
            });

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
        }
    };

    state.suites.forEach(suite => processSuite([suite.name], suite));
    state.tests.forEach(test => processTest([test.name], test));

    return (
        <Box flexDirection="column">
            <Static items={completedTests.map(el => el).sort((el1, el2) => el1.order - el2.order)}>
                {test => <Test key={test.id} status={test.status} paths={test.paths} messages={test.messages} />}
            </Static>
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
