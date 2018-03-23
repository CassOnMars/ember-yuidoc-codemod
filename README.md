# Ember YUIdoc Codemod

This codemod uses [`jscodeshift`](https://github.com/facebook/jscodeshift) to update an Ember application to
use YUIdocs. [ember-modules-codemod](https://github.com/ember-cli/ember-modules-codemod) was used as a base
for this, so there may be some references to it hanging around. I'll try to get that cleaned up.

## Usage

**WARNING**: `jscodeshift`, and thus this codemod, **edit your files in place**.
It does not make a copy. Make sure your code is checked into a source control
repository like Git and that you have no outstanding changes to commit before
running this tool.

The simplest way to use the codemod is like this:

```sh
npm install ember-yuidoc-codemod -g
cd my-ember-app
ember-yuidoc-codemod
```

Or using `npx`:

```sh
npx ember-yuidoc-codemod
```

#### Standalone

This package includes an `ember-yuidoc-codemod` binary that wraps `jscodeshift`
and invokes it with the correct configuration when inside the root directory of
an Ember app.

If you're comfortable with `jscodeshift` already or would rather use it
directly, you can clone this repository and invoke the transform manually:

```sh
npm install jscodeshift -g
git clone https://github.com/ember-cli/ember-yuidoc-codemod
cd my-ember-app
jscodeshift -t ../ember-yuidoc-codemod/transform.js app
```

Note that invoking the transform directly disables the generation of the
Markdown report if any unknown globals are discovered.

## Contributing

### Running Tests

```sh
yarn test // run all tests once
yarn test -- --watchAll // continuously run tests
```

Tests for this codemod work by comparing a paired input and output file in the `__testfixtures__` directory.  Pre-transform files should be of format `<test-name>.input.js`, expected output after the transform should be named `<test-name>.output.js`. Files must use the same `<test-name>` in their names so they can be compared.

### Transform Bugs

If you discover a file in your app that the codemod doesn't handle well, please
consider submitting either a fix or a failing test case.

First, add the file to the `test/input/` directory. Then, make another file with
the identical name and put it in `test/expected-output/`. This file should
contain the JavaScript output you would expected after running the codemod.

For example, if the codemod fails on a file in my app called
`app/components/my-component.js`, I would copy that file into this repository as
`test/input/my-component.js`. Ideally, I will edit the file to the smallest
possible test case to reproduce the problem (and, obviously, remove any
proprietary code!). I might also wish to give it a more descriptive name, like
`preserve-leading-comment.js`.

Next, I would copy *that* file into `test/input/my-component.js`, and hand apply
the transformations I'm expecting.

Then, run `npm test` to run the tests using Mocha. The tests will automatically
compare identically named files in each directory and provide a diff of the
output if they don't match.

Lastly, make changes to `transform.js` until the tests report they are passing.

If you are submitting changes to the transform, please include a test case so we
can ensure that future changes do not cause a regression.

