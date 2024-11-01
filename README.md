# sizrr

A simple command-line tool to analyze and display the sizes of npm packages in your project.

## Features

- Lists all dependencies and their sizes
- Calculates the total size of all packages
- Color-coded output for easy size comparison
- Supports both dependencies and devDependencies
- Human-readable size formatting (B, KB, MB, GB, TB)

## Installation

This package is published on npm. You can install it globally:

```bash
npm install -g sizrr
```

Or use it directly with npx (no installation required):

```bash
npx sizrr
```

## Usage

If installed globally:
```bash
sizrr
```

Without installation (using npx):
```bash
npx sizrr
```

Make sure you're in the root directory of your npm project (where the `package.json` file is located) when running this command.

If you want to skip the npx installation prompt:
```bash
npx --yes sizrr
```

## Output

The output will look something like this:

```
Package Sizes:
======================================
express                     5.23 MB
react                      3.45 MB
lodash                     1.78 MB
...
======================================
Total size:               64.32 MB
```

Packages are color-coded based on their size:
- Green: Less than 1 MB
- Yellow: Between 1 MB and 10 MB
- Red: More than 10 MB

## Requirements

- Node.js >= 14.0.0

## License

MIT