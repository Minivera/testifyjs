const defaultSuite = '';

export interface TestState {
    result?: boolean;
    started: boolean;
    messages: string[];
}

export interface SuiteState {
    result?: boolean;
    started: boolean;
    messages: string[];
    // eslint-disable-next-line no-use-before-define
    state: LoggingState;
}

export interface LoggingState {
    tests: Record<string, TestState>;
    suites: Record<string, SuiteState>;
}

// The version of TypeScript we use has some issues with cyclic types
export const loggingState: LoggingState = {
    suites: {},
    tests: {},
};

const buildSuiteState = (suiteIds: string[]): SuiteState => {
    if (suiteIds.length <= 0) {
        suiteIds.push(defaultSuite);
    }

    let currentSuite: SuiteState = loggingState.suites[suiteIds[0] as string];
    suiteIds.forEach(id => {
        if (!Object.hasOwnProperty.call(currentSuite.state.suites, id)) {
            currentSuite.state.suites[id] = {
                started: false,
                messages: [],
                state: {
                    tests: {},
                    suites: {},
                },
            };
        }

        currentSuite = currentSuite.state.suites[id];
    });

    return currentSuite;
};

const findSuiteState = (suiteIds: string[]): SuiteState => {
    if (suiteIds.length <= 0) {
        suiteIds.push(defaultSuite);
    }

    let currentSuite: SuiteState = loggingState.suites[suiteIds[0] as string];
    suiteIds.slice(1).forEach(id => {
        currentSuite = currentSuite.state.suites[id];
    });

    return currentSuite;
};

export const logger = {
    startTest: (testId: string, ...suiteIds: string[]): void => {
        const currentSuite = buildSuiteState(suiteIds);

        currentSuite.state.tests[testId] = {
            started: true,
            messages: [],
        };
    },

    startSuite: (...suiteIds: string[]): void => {
        const builtSuite = buildSuiteState(suiteIds);
        builtSuite.started = true;
    },

    successTest: (testId: string, ...suiteIds: string[]): void => {
        findSuiteState(suiteIds).state.tests[testId].result = true;
    },

    successSuite: (...suiteIds: string[]): void => {
        findSuiteState(suiteIds).result = true;
    },

    errorTest: (testId: string, ...suiteIds: string[]): void => {
        findSuiteState(suiteIds).state.tests[testId].result = false;
    },

    errorSuite: (...suiteIds: string[]): void => {
        findSuiteState(suiteIds).result = false;
    },

    fatalTest: (message: string, testId: string, ...suiteIds: string[]): void => {
        findSuiteState(suiteIds).state.tests[testId].messages.push(message);
    },

    fatalSuite: (message: string, ...suiteIds: string[]): void => {
        findSuiteState(suiteIds).messages.push(message);
    },
};
