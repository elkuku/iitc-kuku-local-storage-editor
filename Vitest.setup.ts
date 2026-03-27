import Module from 'node:module'

// Register a no-op handler for CSS files so runtime require('./styles.css')
// calls don't fail when Node.js tries to parse CSS as JavaScript.
// eslint-disable-next-line no-underscore-dangle
const extensions = (Module as any)._extensions as Record<string, () => void>
extensions['.css'] = () => { /* intentionally empty */ }
