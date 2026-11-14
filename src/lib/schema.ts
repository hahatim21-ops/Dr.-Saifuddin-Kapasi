/**
 * schema.org JSON-LD for search engines (Person, WebSite, Book, Article).
 * Built from the same content files as the pages, so it never drifts.
 * The doctorate is honorary: it is listed as an award, never as an earned degree.
 */
import type { CollectionEntry } from 'astro:content';
import site from '../data/site.json';

const ORIGIN = 'https://saifuddinkapasi.in';
export const PERSON_ID = `${ORIGIN}/#person`;

export function personSchema(portraitUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Saifuddin Kapasi',
    honorificPrefix: 'Dr.',
    alternateName: site.name,
    description: site.description,
    jobTitle: ['Director, Inflection Point', 'Visiting Faculty'],
    url: ORIGIN,
    ...(portraitUrl ? { image: portraitUrl } : {}),
    sameAs: [site.contact.linkedin],
    address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressCountry: 'IN' },
    worksFor: [
      { '@type': 'Organization', name: 'Inflection Point' },
      { '@type': 'CollegeOrUniversity', name: 'Sydenham Institute of Management Studies (SIMSREE)' },
      { '@type': 'CollegeOrUniversity', name: 'Burhani College of Commerce and Arts' },
    ],
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Sydenham Institute of Management Studies' },
      { '@type': 'CollegeOrUniversity', name: 'Jai Hind College' },
      { '@type': 'CollegeOrUniversity', name: 'Burhani College of Commerce and Arts' },
    ],
    award: [
      'Honorary Doctorate, Cambridge Digital University (2024)',
      'Global Eminence Award — Distinguished Educator & Corporate Trainer, Bestow Edutrex International (2024)',
    ],
    knowsAbout: [
      'Venture leadership',
      'Customer-centric growth',
      'Process architecture',
      'Institutional design',
      'Credit and collections',
      'Productivity management',
    ],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${ORIGIN}/#website`,
    url: ORIGIN,
    name: site.name,
    inLanguage: 'en-IN',
    publisher: { '@id': PERSON_ID },
  };
}

export function bookSchema(book: CollectionEntry<'books'>, url: string, coverUrl?: string) {
  const d = book.data;
  const publisher = d.publisher && !d.publisher.startsWith('PLACEHOLDER') ? d.publisher : undefined;
  const live = d.buyLinks.filter((l) => l.url && l.url !== '#');
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: `${d.title} ${d.titleAccent}`,
    alternativeHeadline: d.subtitle,
    description: d.pitch,
    url,
    author: { '@id': PERSON_ID, '@type': 'Person', name: 'Saifuddin Kapasi' },
    inLanguage: 'en',
    ...(coverUrl ? { image: coverUrl } : {}),
    ...(d.isbn ? { isbn: d.isbn } : {}),
    ...(d.published ? { datePublished: d.published.toISOString().slice(0, 10) } : {}),
    ...(publisher ? { publisher: { '@type': 'Organization', name: publisher } } : {}),
    bookFormat: 'https://schema.org/Paperback',
    ...(live.length ? { sameAs: live.map((l) => l.url) } : {}),
  };
}

export function articleSchema(article: CollectionEntry<'insights'>, url: string) {
  const d = article.data;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: d.title,
    description: d.summary,
    datePublished: d.date.toISOString().slice(0, 10),
    url,
    author: { '@id': PERSON_ID, '@type': 'Person', name: 'Saifuddin Kapasi' },
    inLanguage: 'en-IN',
  };
}
