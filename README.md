## Description

Content Manager Web helps manage users and content within Aquifer and other applications.

## Installation

```bash
$ yarn install
```

## Setup

Use the appropriate config vars for your env (to specify the API URL among other things)

```bash
# local server
$ yarn use-config local

# dev server
$ yarn use-config dev-local
```

## Running the app

```bash
# development
$ yarn run dev - --open

# production mode
$ yarn run build && serve -s build
```

## Lint

```bash
# lint
$ yarn run lint
```

## Test

```bash
# unit tests
$ yarn run test
```
