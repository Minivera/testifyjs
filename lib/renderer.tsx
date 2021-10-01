import React from 'react';
import { Box, Static, Text } from 'ink';
import ms from 'ms';

import { LoggingState, SuiteState, TestState } from './logger';

export interface TestRendererProps {
    state: LoggingState;
    startTime: Date;
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
    path: string;
    messages: string[];
}

const Test: React.FunctionComponent<TestProps> = ({ status, path, messages }) => (
    <Box>
        <Text color="black" backgroundColor={getBackgroundForStatus(status)}>
            {` ${status.toUpperCase()} `}
        </Text>
        <Box marginLeft={1}>
            <Text dimColor>{path.split('/')[0]}/</Text>
            <Text bold color="white">
                {path.split('/')[1]}
            </Text>
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
    isFinished: boolean;
    passed: number;
    failed: number;
    time: string;
}

const Summary: React.FunctionComponent<SummaryProps> = ({ isFinished, passed, failed, time }) => (
    <Box flexDirection="column" marginTop={1}>
        <Box>
            <Box width={14}>
                <Text bold>Test Suites:</Text>
            </Box>
            {failed > 0 && (
                <Text bold color="red">
                    {failed} failed,{' '}
                </Text>
            )}
            {passed > 0 && (
                <Text bold color="green">
                    {passed} passed,{' '}
                </Text>
            )}
            <Text>{passed + failed} total</Text>
        </Box>
        <Box>
            <Box width={14}>
                <Text bold>Time:</Text>
            </Box>
            <Text>{time}</Text>
        </Box>
        {isFinished && (
            <Box>
                <Text dimColor>Ran all test suites.</Text>
            </Box>
        )}
    </Box>
);

interface TestData {
    path: string;
    status: string;
    messages: string[];
}

export const TestRenderer: React.FunctionComponent<TestRendererProps> = ({ startTime, state }) => {
    const completedTests: TestData[] = [];
    const runningTests: TestData[] = [];

    const processSuite = (path: string, suite: SuiteState) => {
        if (suite.started && typeof suite.result === 'undefined') {
            runningTests.push({
                path,
                status: 'running',
                messages: suite.messages,
            });
            return;
        }

        completedTests.push({
            path,
            status: suite.result ? 'fail' : 'success',
            messages: suite.messages,
        });

        Object.keys(suite.state.suites).forEach(key => processSuite(`${path} ${key}`, suite.state.suites[key]));
        Object.keys(suite.state.tests).forEach(key => processTest(`${path} ${key}`, suite.state.tests[key]));
    };

    const processTest = (path: string, test: TestState) => {
        if (test.started && typeof test.result === 'undefined') {
            runningTests.push({
                path,
                status: 'running',
                messages: test.messages,
            });
            return;
        }

        completedTests.push({
            path,
            status: test.result ? 'fail' : 'success',
            messages: test.messages,
        });
    };

    Object.keys(state.suites).forEach(key => processSuite(key, state.suites[key]));
    Object.keys(state.tests).forEach(key => processTest(key, state.tests[key]));

    return (
        <Box flexDirection="column">
            <Static items={completedTests}>
                {test => <Test key={test.path} status={test.status} path={test.path} messages={test.messages} />}
            </Static>
            {runningTests.length > 0 && (
                <Box flexDirection="column" marginTop={1}>
                    {runningTests.map(test => (
                        <Test key={test.path} status={test.status} path={test.path} messages={test.messages} />
                    ))}
                </Box>
            )}

            <Summary
                isFinished={runningTests.length === 0}
                passed={completedTests.filter(test => test.status === 'pass').length}
                failed={completedTests.filter(test => test.status === 'fail').length}
                time={ms(Date.now() - startTime.getTime())}
            />
        </Box>
    );
};
