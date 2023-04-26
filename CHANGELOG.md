# Changelog

## 0.2.0 (2023-04-26)

### Added
- support for `mjs` config file type
- logger

### Changed
- working defaultOutputDirectoryPath in Template props, now it is set as value for CWD variable in root scope
- **option `-t` on `pli init` command changed from `boolean` to `string`, now you can pass config file type as one of `js`, `ts` or `mjs`. Default: `ts`**
- adjusted default config files for `js` and `ts` types

### Fixed
- fixed bug in collectAllBranchVariables that caused it to overwrite parent variables with child variables
- support for ts config files - before it didn't work because of wrong tsc cwd 
- template for raw js files - now it uses `exports.default` instead of `export default`
