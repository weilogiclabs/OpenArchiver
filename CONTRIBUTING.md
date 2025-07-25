# Contributing to Open Archiver

First off, thank you for considering contributing to Open Archiver! It's people like you that make open source such a great community. We welcome any and all contributions.

## Where do I start?

Not sure where to start? You can:

-   Look through the [open issues](https://github.com/LogicLabs-OU/OpenArchiver/issues) for bugs or feature requests.
-   Check the issues labeled `good first issue` for tasks that are a good entry point into the codebase.

## How to Contribute

### Reporting Bugs

If you find a bug, please ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/LogicLabs-OU/OpenArchiver/issues). If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

If you have an idea for an enhancement, please open an issue to discuss it. This allows us to coordinate our efforts and prevent duplication of work.

### Pull Requests

1.  **Fork the repository** and create your branch from `main`.
2.  **Set up your development environment** by following the instructions in the `README.md`.
3.  **Make your changes.** Ensure your code follows the project's coding style.
4.  **Write tests** for any new functionality.
5.  **Ensure all tests pass** before submitting your pull request.
6.  **Update the documentation** if your changes require it.
7.  **Submit a pull request** to the `main` branch of the main repository. Please provide a clear description of the problem and solution. Include the relevant issue number if applicable.

## Contributor License Agreement

By submitting a pull request to this repository, you agree to the following terms and conditions for your contributions:

1.  **Grant of Rights.** You grant to us and our users a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable license to your contributions, allowing us to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute them and such derivative works. This license applies to both copyright and patent claims that you can license, which are necessarily infringed by your contribution alone or in combination with the project.

2.  **Your Representations.** You represent that:

    -   You are legally entitled to grant the above license.
    -   If your employer has rights to intellectual property that you create, you have received permission to make the contributions on behalf of that employer, or your employer has waived such rights for your contributions.
    -   Your contribution is your own original work.
    -   You are not granting a license to any patents or copyrights that you do not own.

3.  **No Other Rights.** Except for the license granted herein, you reserve all right, title, and interest in and to your contributions.

By submitting a contribution, you are agreeing to this license for your contribution. You also agree that you have read and understood this agreement.

## Code of Conduct

This project and everyone participating in it is governed by the [Open Archiver Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## Styleguides

### Git Commit Messages

-   Use the present tense ("Add feature" not "Added feature").
-   Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
-   Limit the first line to 72 characters or less.
-   Reference issues and pull requests liberally after the first line.

### TypeScript Styleguide

-   Follow the existing code style.
-   Use TypeScript's strict mode.
-   Avoid using `any` as a type. Define clear interfaces and types in the `packages/types` directory.
