# Archive - Deprecated Code

This directory contains deprecated implementations that are no longer maintained.

## recipe-transformer-bookmarklet.html

The original bookmarklet implementation that had cross-domain localStorage issues. This approach was abandoned in favor of the Firefox extension because:

- **Cross-domain limitations**: API keys couldn't be shared between different websites
- **Security restrictions**: Content Security Policy blocks made it unreliable
- **Poor user experience**: Required re-entering API keys on each domain
- **Maintenance burden**: Complex URL encoding and escaping issues

The Firefox extension in `/extension/` is the current, maintained implementation.

For historical reference only - do not use.