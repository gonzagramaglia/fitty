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
        <meta name="description" content="Fitty is an AI-powered cat health tracker. Estimate Body Condition Score from two photos and keep your feline in top shape for World Cat Domination Day!" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fitty-demo.vercel.app/" />
        <meta property="og:title" content="Fitty | AI Cat Health Tracker" />
        <meta property="og:description" content="Fitty is an AI-powered cat health tracker. Estimate Body Condition Score from two photos and keep your feline in top shape for World Cat Domination Day!" />
        <meta property="og:image" content="https://fitty-demo.vercel.app/images/fitty-header-bkg.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://fitty-demo.vercel.app/" />
        <meta name="twitter:title" content="Fitty | AI Cat Health Tracker" />
        <meta name="twitter:description" content="Fitty is an AI-powered cat health tracker. Estimate Body Condition Score from two photos and keep your feline in top shape for World Cat Domination Day!" />
        <meta name="twitter:image" content="https://fitty-demo.vercel.app/images/fitty-header-bkg.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicons/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-icon-180x180.png" />
        <link rel="manifest" href="/favicons/manifest.json" />

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
