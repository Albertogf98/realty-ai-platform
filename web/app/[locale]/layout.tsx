import { NextIntlClientProvider } from 'next-intl';
import Header from './components/Header';
import Providers from '../providers/providers';
import { getLocale } from 'next-intl/server';
import CookieBanner from './components/CookieModal';
import ChatBotWidget from './components/ChatBotWidget';
import '../globals.css';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function LocaleLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <title>Real Estate</title>
      <body>
        <NextIntlClientProvider>
          <Providers>
            <a href="#main-content" className="skip-link">
              {locale === 'es' ? 'Saltar al contenido principal' : 'Skip to main content'}
            </a>
            <Header />
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
            <ChatBotWidget />
            <CookieBanner />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
