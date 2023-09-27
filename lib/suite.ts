import { Test, Suite } from './types.js';
import { Runner } from './runner.js';
import { Logger } from './logger.js';

export class SuiteRunner {
    private readonly name: string;
    private readonly suiteIds: string[];

    private suiteBeforeRunner = async (): Promise<void> => {};
    private suiteAfterRunner = async (): Promise<void> => {};
    private individualBeforeRunner = async (): Promise<void> => {};
    private individualAfterRunner = async (): Promise<void> => {};
    private individualRunners: ((logger: Logger) => Promise<boolean>)[] = [];

    constructor(name: string, suiteIds: string[]) {
        this.name = name;
        this.suiteIds = suiteIds;
    }

    public setup(func: () => Promise<void> | void): void {
        const prevRunner = this.suiteBeforeRunner;
        this.suiteBeforeRunner = async () => {
            await prevRunner();
            return func();
        };
    }

    public tearDown(func: () => Promise<void> | void): void {
        const prevRunner = this.suiteAfterRunner;
        this.suiteAfterRunner = async () => {
            await prevRunner();
            return func();
        };
    }

    public beforeEach(func: () => Promise<void> | void): void {
        const prevRunner = this.individualBeforeRunner;
        this.individualBeforeRunner = async () => {
            await prevRunner();
            return func();
        };
    }

    public afterEach(func: () => Promise<void> | void): void {
        const prevRunner = this.individualAfterRunner;
        this.individualAfterRunner = async () => {
            await prevRunner();
            return func();
        };
    }

    public test(name: string, func: (starter: Test) => Promise<void> | void): void {
        this.individualRunners.push(async (logger: Logger) => {
            logger.startTest(name, ...this.allSuiteIds);

            const starter = new Runner(name, ...this.allSuiteIds);

            await func(starter);
            try {
                await this.individualBeforeRunner();
                const passed = await starter.run(logger, {});
                await this.individualAfterRunner();

                if (passed) {
                    logger.successTest(name, ...this.allSuiteIds);
                    return true;
                } else {
                    logger.errorTest(name, ...this.allSuiteIds);
                    return false;
                }
            } catch (e) {
                logger.errorTest(name, ...this.allSuiteIds);
                logger.fatalTest(e as string, name, ...this.allSuiteIds);
                return false;
            }
        });
    }

    public suite(name: string, func: (starter: Suite) => Promise<void> | void): void {
        this.individualRunners.push(async (logger: Logger) => {
            logger.startSuite(...this.allSuiteIds, name);

            const starter = new SuiteRunner(name, this.allSuiteIds);

            await func(starter);
            try {
                await this.individualBeforeRunner();
                const passed = await starter.run(logger);
                await this.individualAfterRunner();

                if (passed) {
                    logger.successSuite(...this.allSuiteIds, name);
                    return true;
                } else {
                    logger.errorSuite(...this.allSuiteIds, name);
                    return false;
                }
            } catch (e) {
                logger.errorSuite(...this.allSuiteIds, name);
                logger.fatalSuite(e as string, ...this.allSuiteIds, name);
                return false;
            }
        });
    }

    public async run(logger: Logger): Promise<boolean> {
        try {
            await this.suiteBeforeRunner();
            let allPassed = true;
            for (const individualRunner of this.individualRunners) {
                const result = await individualRunner(logger);
                if (!result) {
                    allPassed = false;
                }
            }

            await this.suiteAfterRunner();
            return allPassed;
        } catch (e) {
            logger.errorSuite(...this.allSuiteIds);
            logger.fatalSuite(e as string, ...this.allSuiteIds);
            return false;
        }
    }

    private get allSuiteIds(): string[] {
        return this.suiteIds.concat(this.name);
    }
}
