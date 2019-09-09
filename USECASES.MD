# Common use cases
Typeorm-model-generator can be used in multiple ways. Here are some workflows you can use.
## Use directly from npm
You can use typeorm-model-generator directly from npm
```
npx typeorm-model-generator
```
Please remember using `npx typeorm-model-generator` will download latest available version. To avoid it you can specify version each time `npx typeorm-model-generator@0.3.0` or install a package locally - npx will use locally installed version then. 
### command line parameters
You can customize generated output by specifying multiple parameters. Full list of parameters are available through `npx typeorm-model-generator --help`
### config file
If you execute `npx typeorm-model-generator` without specifying any parameters you will enter a wizard mode which will guide you through specifying connection settings and allow to customize generated model. At the end of this process you can save your choices, so the process will run automatically next time.
## clone repo and make manual changes
If you need more power over how models are generated you can fork the repo and make changes to the code specific to your use case there. 
- fork the repo
- clone forked repo locally
- create branch for your changes
```
git checkout -b my-branch master
```
- add remote repository
```
git remote add upstream https://github.com/Kononnable/typeorm-model-generator.git
```
You can run model generation tool by running `npm run start` after installing dependencies.

When you want to download changes made on main typeorm-model-generator repo just
- checkout `master` branch
- download changes from main repository
```
git pull --ff upstream master
```
- checkout branch with your changes
```
git checkout my-branch
```
- merge changes onto your branch
```
git merge master
```

## git repo with dependency and entire pipeline
Similar to last workflow, but this time we don't have to worry about manually merging changes from main repository.
- Init new package
```
npm init -y
```
- Install typeorm-model-generator as a dependency
```
npm install typeorm-model-generator
```
- Write code which loads generated entities files and change its content
- Run typeorm-model-generator, then your code which customizes it(you may add this to `package.json` scripts section)
