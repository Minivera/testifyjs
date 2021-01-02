// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RunnerParams {}

export type ExecutionFunction<T extends RunnerParams = RunnerParams, O extends T = T> = (
    runner: T
) => Promise<O> | O | Promise<void> | void;

export interface Asserter {
    and: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Asserter;
    assert: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Asserter;
}

export interface Acter {
    and: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Acter;
    act: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Acter;
    assert: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Asserter;
}

export interface Arranger {
    and: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Arranger;
    arrange: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Arranger;
    act: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Acter;
    assert: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Asserter;
}

export interface Test {
    arrange: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Arranger;
    act: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Acter;
    assert: <T extends RunnerParams = RunnerParams, O extends T = T>(func: ExecutionFunction<T, O>) => Asserter;
}

export interface Suite {
    setup: (func: () => Promise<void> | void) => void;
    beforeEach: (func: () => Promise<void> | void) => void;
    afterEach: (func: () => Promise<void> | void) => void;
    tearDown: (func: () => Promise<void> | void) => void;
    test: (name: string, func: (starter: Test) => Promise<void> | void) => void;
    suite: (name: string, func: (starter: Suite) => Promise<void> | void) => void;
}
