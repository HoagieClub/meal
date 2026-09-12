import 'evergreen-ui';

// Hoagie themes add a `title` accent colour to Evergreen's theme object.
declare module 'evergreen-ui' {
  interface DefaultTheme {
    title: string;
  }
}
