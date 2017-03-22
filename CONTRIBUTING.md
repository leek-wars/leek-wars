# Contributing

Thanks to contribute to the project. Here are some rules to make your pull requests pleasant to read and faster to integrate :)

## Code style

If you don't know how to format your code, follow the style of the existing code you find in the repository.

### Comments
- Write comments in english, although some are still in French.
- Avoid useless comments like `getFarmerLeeks() // get the farmer leeks`

### Spacing
- Indent with *a simple tab* character, not using 2 or 4 spaces.
- Don't write too long lines (not more than 80-100 characters).
- Put spaces around operators (= + - * /) and after commas and colons: `var a = {a: 1, b: 2} + 2 * 5`.

### Naming
- Give meaningful names to variables, avoid names like `a`, `foo`, `data` (except for loop counters of course).
- In JavaScript, write names in camelCase : `farmerName`, `weaponLevel` etc.
- In CSS, write name with dashes : `#notifications-popup`, `.chat-messages` etc.

## Pull requests and commits

- Create one pull request per feature or bug fix you want to propose. Don't include two features in the same pull request, or one feature plus some bug fix etc.
- Write a clear and meaningful pull request title and description. Explain the purpose, the context, how do you implement your solution as much as possible.

- Create reasonable sized commits, avoid modifying too much different files in a single commit
- Avoid mixing too different languages in a single commit, for instance, separe JavaScript modifications from the CSS and HTML ones.
- Write clear and meaningful commit messages: avoid messages like `bugfix`, `change color`, `many things`, `...`, start the message with a imperative verb, and explain clearly what the commit does, like `Change the color of the chat messages`.
- Limit commit messages to 50 characters.
- Start commit messages with a capital letter, and don't end it with a period.

More information about [commits](http://chris.beams.io/posts/git-commit/) and [pull requests](https://github.com/blog/1943-how-to-write-the-perfect-pull-request).


