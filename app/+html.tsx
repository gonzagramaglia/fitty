import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        <ScrollViewStyleReset />
        
        <title>Fitty | AI Cat Health Tracker</title>
        <meta name="description" content="Fitty - AI Cat Health Tracker" />

        <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/assets/favicons/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicons/apple-icon-180x180.png" />
        <link rel="manifest" href="/assets/favicons/manifest.json" />

        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #f8fafc;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
