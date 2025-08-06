# Release Checklist

## Pre-Release Validation

### Code Quality
- [ ] All JavaScript files pass syntax validation
- [ ] No console.log statements in production code
- [ ] Error handling implemented for all API calls
- [ ] Input validation added for user inputs
- [ ] No hard-coded API keys or sensitive data
- [ ] Code comments are clear and helpful

### Functionality Testing
- [ ] Extension loads without errors in Firefox
- [ ] Extension loads without errors in Chrome (if Manifest V3 used)
- [ ] Icon generation works properly
- [ ] API key configuration saves and persists
- [ ] API key validation works correctly
- [ ] Recipe detection works on major recipe sites
- [ ] Recipe transformation produces valid JSON-LD
- [ ] Unit conversion accuracy verified
- [ ] File download functionality works
- [ ] Keyboard shortcuts function properly
- [ ] Error messages are user-friendly

### File Structure
- [ ] All required files present
- [ ] Icon files generated and correctly sized
- [ ] manifest.json validates as proper JSON
- [ ] Package script works without errors
- [ ] No development files included in package
- [ ] File permissions set correctly

### Documentation
- [ ] README.md updated with current instructions
- [ ] Installation instructions tested and accurate
- [ ] API key setup instructions clear
- [ ] Troubleshooting guide available
- [ ] Version number updated in manifest.json
- [ ] CHANGELOG.md created/updated

### Security Review
- [ ] No API keys exposed in source code
- [ ] Input sanitization implemented
- [ ] Cross-site scripting prevention
- [ ] Content Security Policy compliance
- [ ] Secure storage of sensitive data
- [ ] No eval() or innerHTML with user data

### Browser Compatibility
- [ ] Works on Firefox latest stable
- [ ] Works on Firefox ESR (if supported)
- [ ] Chrome compatibility verified (if applicable)
- [ ] Mobile browser testing (if applicable)

### Performance
- [ ] Extension loads quickly
- [ ] Memory usage reasonable
- [ ] No memory leaks detected
- [ ] API calls have proper timeout handling
- [ ] Large recipe content handled gracefully

## Release Process

### Version Management
- [ ] Version number follows semantic versioning
- [ ] Git tag created for release
- [ ] Release notes prepared
- [ ] Breaking changes documented

### Distribution Preparation
- [ ] Extension packaged correctly
- [ ] Package tested on clean browser profile
- [ ] Store listing prepared (if applicable)
- [ ] Screenshots updated
- [ ] Permissions list reviewed

### Post-Release
- [ ] Monitor for user feedback
- [ ] Check error reporting/telemetry
- [ ] Prepare hotfix process if needed
- [ ] Update documentation if issues found

## Testing Commands

Run these commands before release:

```bash
# From extension directory
./test.sh                    # Run test suite
./setup.sh                   # Validate setup process
./package.sh                 # Test packaging
```

## Version History Template

Add to CHANGELOG.md:

```markdown
## [1.0.0] - YYYY-MM-DD
### Added
- Initial release
- Recipe transformation with metric conversion
- Firefox extension support
- Gemini AI integration

### Changed
- N/A

### Fixed
- N/A

### Security
- Secure API key storage implementation
```
