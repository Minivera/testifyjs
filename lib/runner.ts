import { RunnerParams, ExecutionFunction, Arranger, Acter, Asserter } from './types';
import { Logger } from './logger';

export class Runner {
    private readonly name: string;
    private readonly suiteIds: string[];

    constructor(name: string, ...suiteIds: string[]) {
        this.name = name;
        this.suiteIds = suiteIds;
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    private runner = async (params: any): Promise<any> => ({ ...params });

    public arrange<T extends RunnerParams = RunnerParams, O extends T = T>(
        arrangeFunc: ExecutionFunction<T, O>
    ): Arranger {
        const prevRunner = this.runner;
        this.runner = async (params: T) => {
            const prev = (await prevRunner(params)) as T;
            const result = await arrangeFunc(prev);
            return result || prev;
        };

        return {
            arrange: this.arrange.bind(this),
            and: this.arrange.bind(this),
            act: this.act.bind(this),
            assert: this.assert.bind(this),
        };
    }

    public act<T extends RunnerParams = RunnerParams, O extends T = T>(actFunc: ExecutionFunction<T, O>): Acter {
        const prevRunner = this.runner;
        this.runner = async (params: T) => {
            const prev = (await prevRunner(params)) as T;
            const result = await actFunc(prev);
            return result || prev;
        };

        return {
            and: this.act.bind(this),
            act: this.act.bind(this),
            assert: this.assert.bind(this),
        };
    }

    public assert<T extends RunnerParams = RunnerParams, O extends T = T>(
        assertFunc: ExecutionFunction<T, O>
    ): Asserter {
        const prevRunner = this.runner;
        this.runner = async (params: T) => {
            const prev = (await prevRunner(params)) as T;
            const result = await assertFunc(prev);
            return result || prev;
        };

        return {
            and: this.assert.bind(this),
            assert: this.assert.bind(this),
        };
    }

    public async run(logger: Logger, params: Record<string, unknown>): Promise<boolean> {
        try {
            await this.runner(params);
            return true;
        } catch (e) {
            logger.fatalTest(e as string, this.name, ...this.suiteIds);
            return false;
        }
    }
}
