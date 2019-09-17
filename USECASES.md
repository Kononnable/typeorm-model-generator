# Common use cases
Typeorm-model-generator can be used in multiple workflows. Here are described few recommended ones.
## Use directly from npm
You can use typeorm-model-generator directly from npm:
```
npx typeorm-model-generator
```
Please remember that by using `npx typeorm-model-generator` you will download latest available version. To avoid it you can specify version each time `npx typeorm-model-generator@0.3.0` or install a package locally - npx will use locally installed version then. 
### command line parameters
You can customize generated output by specifying multiple parameters. Full list of parameters are available through `npx typeorm-model-generator --help`
### config file
If you execute `npx typeorm-model-generator` without specifying any parameters you will enter a wizard mode which will guide you through specifying connection settings and allow to customize generated models. At the end of this process you will be able to save your settings, so the process will run automatically next time.
## clone repo and make manual changes
If you need more power over how models are generated you can fork the repo and make changes to the code which are specific to your use case. 
- fork the repo
- clone forked repo locally
- create branch for your changes:
```
git checkout -b my-branch master
```
- add remote repository:
```
git remote add upstream https://github.com/Kononnable/typeorm-model-generator.git
```
You can run model generation tool by running `npm run start` after installing dependencies.

When you want to download changes made on main typeorm-model-generator repo just
- checkout `master` branch
- download changes from main repository:
```
git pull --ff upstream master
```
- checkout branch with your changes:
```
git checkout my-branch
```
- merge changes onto your branch:
```
git merge master
```

## git repo with dependency and entire pipeline
Similar to previous workflow, but this time we don't have to worry about manually merging changes from main repository.
- Init new package:
```
npm init -y
```
- Install typeorm-model-generator as a dependency:
```
npm install typeorm-model-generator
```
- Write code which loads generated entity files and change its content
- Run typeorm-model-generator, then your code which customizes it (you may add this step to `package.json` scripts section)
