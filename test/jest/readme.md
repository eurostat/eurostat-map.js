## Testing with Jest

- All .test.js files are executed by the command `npm test` using the template "test.html"
- Each test is run in a separate, headless version of chrome.
- New tests should have their own .test.js file, pointing to test.html.
- Jest will automatically find these new files and include them in it's test execution.

A successful output should look something like this:

``` 
$ npm test

 PASS  test/jest/ch-ct.test.js
 PASS  test/jest/choropleth.test.js
 PASS  test/jest/categorical.test.js
 PASS  test/jest/legend.test.js
 PASS  test/jest/proportional-symbol.test.js

Test Suites: 5 passed, 5 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        3.918 s
Ran all test suites.

```

Note: Make sure you have a version of node.js that is 10.x or later