# Changelog

## 0.2.2 (2023-04-26)

### Added
- Reactive variables, and new option to activate them in TemplateVariable props. Option is named `reactive` and determines if variable should react to changes in parent scopes. Default: `false`

### Fixed
- `CWD` overriding from cli
- default value for `CWD` will be now extracted from option `defaultOutputDirectoryPath` in Template. It happens in CliRenderer class after template selection in UI

### Modified
- Builtin `CWD` variable is now a reactive variable, which means it reacts to changes triggered in parent scopes, and creates its value based on value taken from parent 
- `index` property in TemplateVariable is now placed in `ui` options object

### Removed
- method `getInheritanceChainForVariable` from `ITemplateVariable` interface and `TemplateVariable` class as it was no longer needed


## 0.2.1 (2023-04-26)

### Modified
- fallback to empty arrays when merging templates

## 0.2.0 (2023-04-26)

### Added
- support for `mjs` config file type
- logger

### Changed
- working defaultOutputDirectoryPath in Template props, now it is set as value for CWD variable in root scope
- **option `-t (typescript) boolean` on `pli init` command changed to `-t (type) string`, now you can pass config file type as one of `js`, `ts` or `mjs`. Default: `ts`**
- adjusted default config files for `js` and `ts` types

### Fixed
- fixed bug in collectAllBranchVariables that caused it to overwrite parent variables with child variables
- support for ts config files - before it didn't work because of wrong tsc cwd 
- template for raw js files - now it uses `exports.default` instead of `export default`
