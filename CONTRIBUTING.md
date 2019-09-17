# Contributing to typeorm-model-generator


 - [Question or Problem?](#question)
 - [Submission Guidelines](#submit)



## <a name="question"></a> Got a Question or Problem?
* You can create issue on [github](https://github.com/Kononnable/typeorm-model-generator/issues)
* While this tool doesn't have separate separate chat room you can use [typeorm slack workspace](https://join.slack.com/t/typeorm/shared_invite/enQtNDQ1MzA3MDA5MTExLTFiNDEyOGUxZGQyYWIwOTA0NDQxODdkOGQ0OTUxNzFjYjUwY2E0ZmFlODc5OTYyYzAzNGM3MGZjYzhjYTBiZTY) since everyone using typeorm-model-generator will also use typeorm.



## <a name="submit"></a> Submission Guidelines

### <a name="submit-issue"></a> Submitting an Issue

Before submitting new issue, please check the issue tracker, maybe your problem is already described and the discussion might inform you of available workarounds.

Before fixing a bug we need to reproduce and confirm it. In order to reproduce bugs, we will ask you to provide a minimal reproduction. Having a minimal reproducible scenario gives us a wealth of important information without going back & forth to you with additional questions. A minimal reproduction allows us to quickly confirm a bug (or point out a coding problem) as well as confirm that we are fixing the right problem.

### <a name="submit-pr"></a> Submitting a Pull Request (PR)
Before you submit your Pull Request (PR) consider the following guidelines:

1. Search [GitHub](https://github.com/Kononnable/typeorm-model-generator/pulls) for an open or closed PR that relates to your submission. You don't want to duplicate effort.
1. Make your changes in a new git branch:

     ```shell
     git checkout -b my-fix-branch master
     ```

1. Create your patch.
1. Run test suite and ensure that all tests pass.
1. Commit your changes using a descriptive commit message.

1. Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

1. In GitHub, send a pull request to `typeorm-model-generator:master`.
* If we suggest changes then:
  * Make the required updates.
  * Re-run test suites to ensure tests are still passing.
  * Push to your GitHub repository (this will update your Pull Request)

Note: if you don't want to run tests on your machine you can rely on tests run on CI (unless you're changing something oracledb specific).

That's it! Thank you for your contribution!
