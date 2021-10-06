export interface TestState {
    name: string;
    order: number;
    result?: boolean;
    started: boolean;
    messages: string[];
}

export interface SuiteState {
    name: string;
    order: number;
    result?: boolean;
    started: boolean;
    messages: string[];
    // eslint-disable-next-line no-use-before-define
    state: LoggingState;
}

export interface LoggingState {
    tests: TestState[];
    suites: SuiteState[];
}

export class Logger {
    private subscriber: (state: LoggingState) => void = () => {};

    private loggingState: LoggingState = {
        suites: [],
        tests: [],
    };

    private currentCount = 0;

    get state() {
        return this.loggingState;
    }

    setSubscriber = (func: (state: LoggingState) => void): void => {
        this.subscriber = func;
    };

    clearSubscriber = (): void => {
        this.subscriber = () => {};
    };

    private buildSuiteState = (suiteIds: string[]): SuiteState => {
        let currentSuite: SuiteState | undefined;
        suiteIds.forEach(id => {
            if (!currentSuite) {
                let tempSuite = this.loggingState.suites.find(el => el.name === id);

                if (!tempSuite) {
                    tempSuite = {
                        name: id,
                        order: this.currentCount++,
                        started: false,
                        messages: [],
                        state: {
                            tests: [],
                            suites: [],
                        },
                    };
                    this.loggingState.suites.push(tempSuite);
                }

                currentSuite = tempSuite;
                return;
            }

            let tempSuite = currentSuite.state.suites.find(el => el.name === id);

            if (!tempSuite) {
                tempSuite = {
                    name: id,
                    order: this.currentCount++,
                    started: false,
                    messages: [],
                    state: {
                        tests: [],
                        suites: [],
                    },
                };
                currentSuite.state.suites.push(tempSuite);
            }

            currentSuite = tempSuite;
        });

        if (!currentSuite) {
            throw new Error('Error, suite could not be processed.');
        }

        return currentSuite;
    };

    private findSuiteState = (suiteIds: string[]): SuiteState => {
        let currentSuite: SuiteState = this.loggingState.suites.find(el => el.name === suiteIds[0]) as SuiteState;
        suiteIds.slice(1).forEach(id => {
            currentSuite = currentSuite.state.suites.find(el => el.name === id) as SuiteState;
        });

        return currentSuite;
    };

    startTest = (testId: string, ...suiteIds: string[]): void => {
        if (suiteIds.length <= 0) {
            this.loggingState.tests.push({
                name: testId,
                order: this.currentCount++,
                started: true,
                messages: [],
            });
        } else {
            const currentSuite = this.findSuiteState(suiteIds);

            currentSuite.state.tests.push({
                name: testId,
                order: this.currentCount++,
                started: true,
                messages: [],
            });
        }

        this.subscriber(this.loggingState);
    };

    startSuite = (...suiteIds: string[]): void => {
        const builtSuite = this.buildSuiteState(suiteIds);
        builtSuite.started = true;

        this.subscriber(this.loggingState);
    };

    successTest = (testId: string, ...suiteIds: string[]): void => {
        let testArray: TestState[];

        if (suiteIds.length <= 0) {
            testArray = this.loggingState.tests;
        } else {
            testArray = this.findSuiteState(suiteIds).state.tests;
        }

        (testArray.find(el => el.name === testId) as TestState).result = true;

        this.subscriber(this.loggingState);
    };

    successSuite = (...suiteIds: string[]): void => {
        this.findSuiteState(suiteIds).result = true;

        this.subscriber(this.loggingState);
    };

    errorTest = (testId: string, ...suiteIds: string[]): void => {
        let testArray: TestState[];

        if (suiteIds.length <= 0) {
            testArray = this.loggingState.tests;
        } else {
            testArray = this.findSuiteState(suiteIds).state.tests;
        }

        (testArray.find(el => el.name === testId) as TestState).result = false;

        this.subscriber(this.loggingState);
    };

    errorSuite = (...suiteIds: string[]): void => {
        this.findSuiteState(suiteIds).result = false;

        this.subscriber(this.loggingState);
    };

    fatalTest = (message: string, testId: string, ...suiteIds: string[]): void => {
        let testArray: TestState[];

        if (suiteIds.length <= 0) {
            testArray = this.loggingState.tests;
        } else {
            testArray = this.findSuiteState(suiteIds).state.tests;
        }

        (testArray.find(el => el.name === testId) as TestState).messages.push(message);

        this.subscriber(this.loggingState);
    };

    fatalSuite = (message: string, ...suiteIds: string[]): void => {
        this.findSuiteState(suiteIds).messages.push(message);

        this.subscriber(this.loggingState);
    };
}
