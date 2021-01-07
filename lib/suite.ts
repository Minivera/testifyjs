import { Test, Suite } from './types';
import { Runner } from './runner';
import { logger } from './logger';

export class SuiteRunner {
    private readonly name: string;

    private suiteBeforeRunner = async (): Promise<void> => {};
    private suiteAfterRunner = async (): Promise<void> => {};
    private individualBeforeRunner = async (): Promise<void> => {};
    private individualAfterRunner = async (): Promise<void> => {};
    private individualRunners: (() => Promise<boolean>)[] = [];

    constructor(name: string) {
        this.name = name;
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
        this.individualRunners.push(async () => {
            logger.start(`${this.name} -> ${name}`);

            const starter = new Runner();

            await func(starter);
            try {
                await this.individualBeforeRunner();
                const passed = await starter.run({});
                await this.individualAfterRunner();

                if (passed) {
                    logger.success(`${this.name} -> ${name}`);
                    return true;
                } else {
                    logger.error(`${this.name} -> ${name}`);
                    return false;
                }
            } catch (e) {
                logger.error(`${this.name} -> Failed to execute entire test, see error message for more information`);
                logger.fatal(e);
                return false;
            }
        });
    }

    public suite(name: string, func: (starter: Suite) => Promise<void> | void): void {
        this.individualRunners.push(async () => {
            logger.start(`${this.name} -> ${name}`);

            const starter = new SuiteRunner(`${this.name} -> ${name}`);

            await func(starter);
            try {
                await this.individualBeforeRunner();
                const passed = await starter.run();
                await this.individualAfterRunner();

                if (passed) {
                    logger.success(`${this.name} -> ${name}`);
                    return true;
                } else {
                    logger.error(`${this.name} -> ${name}`);
                    return false;
                }
            } catch (e) {
                logger.error(
                    `${this.name} -> Failed to execute entire test suite, see error message for more information`
                );
                logger.fatal(e);
                return false;
            }
        });
    }

    public async run(): Promise<boolean> {
        try {
            await this.suiteBeforeRunner();
            let allPassed = true;
            for (const individualRunner of this.individualRunners) {
                const result = await individualRunner();
                if (!result) {
                    allPassed = false;
                }
            }

            await this.suiteAfterRunner();
            return allPassed;
        } catch (e) {
            logger.error('Failed to execute entire test suite, see error message for more information');
            logger.fatal(e);
            return false;
        }
    }
}
