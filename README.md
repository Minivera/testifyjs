# Testifyjs
Testify is a unit-testing framework for JavaScript and TypeScript providing and recognizable experience, but with added
simplicity, clarity, and reusability. Written in TypeScript, Testify can be integrated in any project without having
to learn a separate CLI and configuration system. Just load testify and execute your script with node!

## Why another testing framework?
I was relatively unhappy with how much magic and configuration goes into the average testing framework. I wanted
to experiment with a framework where I can focus on writing simple and reusable code without any headaches. A test
framework should not a challenge to use, understand, or implement, I wanted to know if an alternative was possible.

Another major difficulty I have with testing framework is the lack of a traditional unit test structure. It leads
to big tests where it gets hard to find where the data is set, where the test is executed, and where the data is
checked. I've always been a fan of the [Arrange-Act-Assert](https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/) 
structure for unit tests, and I wanted to see if a framework would be built around this standard.

Testify is not an attempt at revolutionizing the way people write tests in JavaScript, nor is it a <insert test
framework here> killer. It's a small project I designed to answer the above questions. I hope you will enjoy trying
out testify for yourself and seeing if it helps you write better tests.

## Why use Testify?

* Very small library and API
* Built with TypeScript, for TypeScript
* Asynchronous support out of the box
* Support for test suites
* No magic or global injected variables, everything is imported or provided
* Bring your own assertion framework or mocking library
* All tests are sequential
* Encourages writing small testing helpers over massive test methods (Arrange-Act-Assert)
* No CLI, bring your own node and run testify with your configuration

## How to use

To get started, install testify using NPM

```
npm install @minivera/testifyjs
```

Create a main test file somewhere in your code base, import testify, and run it.

```js
import { testify, test } from '@minivera/testifyjs';

// Create a single test
test('Hello, World!', test => {
  test
    // Arrange your data before acting
    .arrange(() => ({
      message: '',
    }))
    // Update the data based on what you are testing
    .act(({ message }) => ({
      message: 'Hello, World!'
    }))
    // Assert that the actions executed properly
    .assert(({ message }) => {
      if (message !== 'Hello, World!') {
        throw new Error('Message should be "Hello, World!"');
      }
    });
});

// Run all the tests in the order they were created
await testify();
```

Execute this script with node and let testify take over.

```bash
node test.js
```

### TypeScript support
Testify was built in TypeScript, for TypeScript. Here is the same example, but built in TypeScript.

```typescript
import { testify, test } from '@minivera/testifyjs';

test('Hello, World!', test => {
  interface Input {
    message: string;
  }
    
  test
    // First generic is the type of the parameter, second is the return type
    .arrange<{}, Input>(() => ({
      message: '',
    }))
    .act<Input>(({ message }) => ({
      message: 'Hello, World!'
    }))
    .assert<Input>(({ message }) => {
      if (message !== 'Hello, World!') {
        throw new Error('Message should be "Hello, World!"');
      }
    });
});

await testify();
```

All the type definitions are available directly form the main `testify` import.

### Asynchronous code
Async methods are supported by default, simply create a function returning a promise or an async function, and testify
will make sure to execute the code synchronously.

```typescript
import { testify, test } from '@minivera/testifyjs';

const someApiCall = async (body: string) => {
  return await fetch('somewhere', body);  
};


test('async test', test => {
  interface Input {
    body: string;
  }
  
  interface Output {
    body: string;
    result: string;
  }
    
  test
    .arrange<{}, Input>(() => ({
      body: JSON.stringify({}),
    }))
    .act<Input, Output>(async ({ body }) => {
        const result = await someApiCall(body);
        return {
            body,
            result,
        };
    })
    .assert<Output>(({ result }) => {
      if (result !== 'Hello, World!') {
        throw new Error('Message should be "Hello, World!"');
      }
    });
});

await testify();
```

### Triggering a test failure
At any point in you tests, you may throw an error to trigger a test failure. Testify will gracefully report the error
and report the test failure.


```typescript
import { testify, test } from '@minivera/testifyjs';

test('failing test', test => {
  const triggerError = () => {
      throw new Error('test');
  };
    
  test
    .arrange(triggerError)
    .act(triggerError) // Will never be executed
    .assert(triggerError); // Will never be executed
});

await testify();
```

### Using suites
Testify supports test suites to better organize tests or trigger specific behavior before and after tests.

```typescript
import { testify, suite } from '@minivera/testifyjs';

suite('test suite', suite => {
  suite.setup(() => {
    // Will be executed when the suite starts, may be async
  });
  
  suite.tearDown(() => {
    // Will be executed when the suite ends, may be async
  });
  
  suite.beforeEach(() => {
    // Will be executed before every test or nested test suite, may be async
  });

  suite.afterEach(() => {
    // Will be executed after every test or nested test suite, may be async
  });
    
  // Can run individual test, they will be printed as part of the suite
  suite.test('test', test => {
    test
      .arrange(someArrange)
      .act(someAct)
      .assert(someAssert);
  });

  // Suites can be freely nested
  suite.suite('nested', suite => {
    // ...
  });
});

await testify();
```

### Tests in multiple files
`testify` will execute all registered tests at the moment it's run. You can divide your tests into multiple files
by using the node module system. Make sure to call `testify` **after** you import all your tests.

```typescript
// somefile.ts
import { test } from '@minivera/testifyjs';

test('some test', () => { /* ... */ });

// test.ts
import './somefile';

await testify();
```

## API

### The test function
> `import { test } from '@minivera/testifyjs';`

`test` takes two arguments, a name to be displayed when executing the test, and a test configuration function. The
function receives the test object as its only parameter.

### The suite function
> `import { suite } from '@minivera/testifyjs';`

`suite` takes two arguments, a name to be displayed when executing the suite's test, and a suite configuration function. 
The function receives the suite object as its only parameter.


### The testify function
> `import { testify } from '@minivera/testifyjs';`

`testify` executes all the tests saved up to this point.

### The Test object
> `test('name', test => { /* test is your test object */});`

The test object is used to configure a single test. By itself, the test configuration function does nothing, we
need to provide it with test units.

`test.arrange` takes a function as its parameter. This function will have the return value from the previous function
in the chain as its parameter. A function may not return anything, in which case the return value from the previous
chain is used as the return value. The first function receives an empty object as its parameter.

In TypeScript, the two generic parameters can be used to add type definitions to the input parameters and the output
value. The second generic can be omitted, it will use the first value by default.

For example:

```typescript
import { test } from '@minivera/testifyjs';

test('some test', test => {
  interface A {
    test: number;
  }

  interface B {
    test: string;
  }
    
  test.arrange<{}, A>(params => {
    // params is {}
    return {
      test: 1,
    };
  }).arrange<A>(params => {
    // params is { test: 1 }
  }).arrange<A, B>(params => {
    // params is still { test: 1 }
    return {
      test: `${params.test}`,
    }
  })
});
```

`arrange`, `act`, and `assert` may be called as a chain to continue configuring this single test. `and` is also
available as syntactic sugar to call `arrange` multiple times.

`test.act` is identical to `test.arrange`, with the difference that only `act` and `assert` are available for chaining
`and` is still available as syntactic sugar to call `act` multiple times.

`test.act` is identical to `test.act`, with the difference that only `assert` is available for chaining
`and` is still available as syntactic sugar to call `assert` multiple times.

All functions provided to `arrange`, `act`, and `assert` may be async or return a promise. All steps will be executed
sequentially and async methods will be `await`-ed.

### The Suite object
> `suite('name', suite => { /* suite is your suite object */});`

The suite object is used to configure a test suite. The suite function does nothing if the suite is not configured
by calling its methods. It also provides hooks to prepare data before or after the execution of the suites or individual
tests.

The `suite.setup` hook takes a function as its single parameter and will set that function to be executed before the suite
is executed proper. The function may be called multiple times to add a sequence of setup functions.

The `suite.tearDown` hook takes a function as its single parameter and will set that function to be executed after the suite
has been executed. The function may be called multiple times to add a sequence of teardown functions.

The `suite.beforeEach` hook takes a function as its single parameter and will set that function to be executed before every test
or nested suite executes. The function may be called multiple times to add a sequence of functions.

The `suite.afterEach` hook takes a function as its single parameter and will set that function to be executed after every test
or nested suite executes. The function may be called multiple times to add a sequence of functions.

`suite.test` function like the `test` function with the exception that this test will be executed as part of the
suite.

`suite.suite` function like the `suite` function with the exception that this test will be executed as part of the
suite. Suites can be nested indefinitely. Hooks of a nest suite will not conflict with the hooks of its parents.

## Inspiration

* [Ava](https://github.com/avajs/ava)
* [jest](https://jestjs.io/)
* [Golang testing](https://golang.org/pkg/testing/)
