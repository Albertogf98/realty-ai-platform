import { useTranslations } from 'next-intl';

export default function PoliticaPrivacidad() {
  const t = useTranslations('Privacy');

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        {/* Title */}
        <header className="mb-10 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('title')}</h1>
          <p className="mt-4 max-w-2xl text-gray-600">{t('intro')}</p>
        </header>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">{t('section1.title')}</h2>
          <div className="rounded-xl bg-gray-50 p-4 text-gray-700">
            <p>
              <strong>{t('section1.content.responsible')}</strong> {t('section1.content.name')}
              <br />
              <strong>{t('section1.content.email')}</strong> <span className="text-blue-600">{t('section1.content.emailValue')}</span>
              <br />
              <strong>{t('section1.content.domain')}</strong> {t('section1.content.domainValue')}
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">{t('section2.title')}</h2>
          <p className="mb-4 text-gray-700">{t('section2.intro')}</p>

          <ul className="space-y-2 pl-6 text-gray-700 marker:text-blue-500 list-disc">
            {t.raw('section2.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Reusable section style */}
        {(['section3', 'section4', 'section5', 'section7', 'section8'] as const).map(sectionKey => (
          <section key={sectionKey} className="mb-10">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">{t(`${sectionKey}.title`)}</h2>
            <p className="text-gray-700">{t(`${sectionKey}.content`)}</p>
          </section>
        ))}

        {/* Section 6 (special content) */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">{t('section6.title')}</h2>
          <p className="text-gray-700">
            {t('section6.content')} <span className="font-medium text-blue-600">{t('section1.content.emailValue')}</span>
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t pt-6 text-sm text-gray-500">
          {t('lastUpdate')} <time dateTime={new Date().toISOString()}>{new Date().toLocaleDateString()}</time>
        </footer>
      </article>
    </main>
  );
}
