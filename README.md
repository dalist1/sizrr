# @dalist1/sizr

A simple command-line tool to analyze and display the sizes of npm packages in your project, published on JSR and designed to run with Bun.

## Features

- Lists all dependencies and their sizes
- Calculates the total size of all packages
- Color-coded output for easy size comparison
- Supports both dependencies and devDependencies
- Human-readable size formatting (B, KB, MB, GB, TB)

## Installation

This package is published on JSR (JavaScript Registry). To use it, you need to have Bun installed on your system.

If you haven't installed Bun yet, you can do so by following the instructions on the [official Bun website](https://bun.sh/).

## Usage

You can run this script directly using Bun's `bunx` command:

```bash
bunx jsr:@dalist1/sizr
```

Make sure you're in the root directory of your npm project (where the `package.json` file is located) when running this command.

## Output

The output will look something like this:

```
Package Sizes:
======================================
express                     5.23 MB
react                       3.45 MB
lodash                      1.78 MB
...
======================================
Total size:                64.32 MB
```

Packages are color-coded based on their size:
- Green: Less than 1 MB
- Yellow: Between 1 MB and 10 MB
- Red: More than 10 MB