// ─────────────────────────────────────────────────────────────
// Single source of truth for business locations.
//
// Every component, page, JSON-LD block and the quote-notification
// email pulls name / address / phone / hours from here — never hardcode
// an address anywhere else.
//
// Unfilled values are the literal [TOKEN] strings listed in each
// entry. Replace the token with the real value and everything updates:
// components render an unfilled token as plain text (no dead tel:/href
// link) and JSON-LD omits the field until it is filled.
// ─────────────────────────────────────────────────────────────

export const SITE_URL = 'https://www.tulipstone.ca';

export const company = {
  name: 'Tulip Limestone · Precast',
  alternateName: 'Tulip Precast',
  email: 'office@tulipprecast.com',
  // Company main lines (published on the site before the second location).
  // Not tied to a specific location.
  phones: [
    { display: '647-534-7755', e164: '+16475347755' },
    { display: '905-796-0110', e164: '+19057960110' },
  ],
  sameAs: [
    'https://www.instagram.com/tulipstone_and_precast/',
    'https://www.facebook.com/tulipprecast.ca/',
    'https://www.linkedin.com/company/tulip-precast-inc/?originalSubdomain=ca',
    'https://www.youtube.com/@TulipStonefabrication',
  ],
};

// ── Transition period ────────────────────────────────────────
// Set showBanner to false to remove the announcement bar site-wide.
// Change bannerId when the message changes so visitors who dismissed
// the old one see the new one.
export const transition = {
  showBanner: true,
  bannerId: 'two-locations-2026',
  message: 'We’ve expanded — now serving you from Mississauga and Brampton.',
  linkText: 'View locations',
  linkHref: '/contact#locations',
  // 'mississauga' | 'brampton'. Drives the "New location" tag.
  // Set it to anything else (or a [TOKEN]) to hide the tag.
  newLocation: 'mississauga',
};

/**
 * @typedef {{ display: string, e164: string }} Phone
 * @typedef {{ days: string, time: string }} HoursRow
 * @typedef {{ display: HoursRow[], spec: { days: string[], opens: string, closes: string }[] }} Hours
 * @typedef {{
 *   id: string, city: string, region: string, postalCode: string, country: string,
 *   street: string, unit: string,
 *   phone: Phone | string,
 *   hours: Hours | string,
 *   lat: number | string, lng: number | string,
 *   mapsUrl: string, gbpUrl: string,
 *   description: string,
 *   heroImage: string,
 * }} Location
 */

// Both locations currently share the same phone line and hours.
// To give a location its own, replace the reference in its entry below.
const sharedPhone = company.phones[0];

// Existing published hours (previously on the contact page).
const sharedHours = {
  display: [
    { days: 'Monday \u2013 Friday', time: '8:00 AM \u2013 5:00 PM' },
    { days: 'Saturday \u2013 Sunday', time: 'By appointment' },
  ],
  spec: [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
  ],
};

/** @type {Location[]} */
export const locations = [
  {
    id: 'mississauga',
    city: 'Mississauga',
    region: 'ON',
    postalCode: 'L4X 2C8',
    country: 'CA',
    street: '3130 Universal Drive',
    unit: '',
    phone: sharedPhone,
    hours: sharedHours,
    lat: 43.62323408459827,
    lng: -79.57406408260572,
    // Plain Google Maps search link built from the address (no token needed).
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=3130+Universal+Drive%2C+Mississauga%2C+ON+L4X+2C8',
    gbpUrl: '[GBP_URL_MISSISSAUGA]',
    heroImage: '/pictures/masonry%20detail.jpg',
    // DRAFT COPY — confirm what is actually offered at this location.
    description:
      'Our Mississauga location serves Mississauga and the surrounding western GTA. Send us your drawings, request a quote, or call ahead to arrange a visit.',
  },
  {
    id: 'brampton',
    city: 'Brampton',
    region: 'ON',
    postalCode: 'L6W 3J5',
    country: 'CA',
    street: '98 Rutherford Rd S',
    unit: 'Unit 2C',
    phone: sharedPhone,
    hours: sharedHours,
    lat: 43.6975248,
    lng: -79.7352554,
    // Existing Google Maps place link (previously in the footer).
    mapsUrl:
      'https://www.google.com/maps/place/Tulip+Stone+and+Precast/@43.6975248,-79.7352554,17z/data=!4m6!3m5!1s0x882b2fa4992c9cc5:0x6a48582350b20292!8m2!3d43.6975248!4d-79.7352554!16s%2Fg%2F11fswp0jnt',
    gbpUrl: 'https://g.page/r/CZICslAjWEhqEAI/review',
    heroImage: '/pictures/hero%20image.jpg',
    description:
      'Our Brampton location is home to our fabrication shop, drafting office, and stone yard. Stop by to see physical Indiana Limestone samples, talk through your drawings with the team that fabricates your project, or arrange a site visit.',
  },
];

// ── Helpers ──────────────────────────────────────────────────

/** True for an unfilled [TOKEN] placeholder. */
export const isPlaceholder = (v) => typeof v === 'string' && /^\[[A-Z0-9_]+\]$/.test(v);

export const getLocation = (id) => locations.find((l) => l.id === id);

/** "98 Rutherford Rd S, Unit 2C" / "3130 Universal Drive" */
export const streetLine = (loc) => (loc.unit ? `${loc.street}, ${loc.unit}` : loc.street);

/** "Brampton, ON L6W 3J5" */
export const cityLine = (loc) => `${loc.city}, ${loc.region} ${loc.postalCode}`;

/** "98 Rutherford Rd S, Unit 2C, Brampton, ON L6W 3J5" */
export const fullAddress = (loc) => `${streetLine(loc)}, ${cityLine(loc)}`;

export const locationPath = (loc) => `/locations/${loc.id}`;

export const locationUrl = (loc) => `${SITE_URL}/locations/${loc.id}/`;

/** "Mississauga & Brampton" (or "A, B & C") */
export const cityList = () => {
  const names = locations.map((l) => l.city);
  return names.length > 1
    ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
    : names[0] ?? '';
};

export const hasCoords = (loc) => typeof loc.lat === 'number' && typeof loc.lng === 'number';
export const hasPhone = (loc) => typeof loc.phone === 'object';
export const hasHours = (loc) => typeof loc.hours === 'object';
export const hasGbp = (loc) => !isPlaceholder(loc.gbpUrl);

export const isNewLocation = (loc) => transition.newLocation === loc.id;

const addressQuery = (loc) => encodeURIComponent(fullAddress(loc));

export const directionsUrl = (loc) =>
  hasCoords(loc)
    ? `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${addressQuery(loc)}`;

export const mapEmbedUrl = (loc) =>
  hasCoords(loc)
    ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}(${encodeURIComponent(company.name)})&z=17&output=embed`
    : `https://www.google.com/maps?q=${addressQuery(loc)}&z=17&output=embed`;

// ── JSON-LD ──────────────────────────────────────────────────

const areaServed = [
  'Brampton', 'Mississauga', 'Oakville', 'Burlington', 'Hamilton',
  'Toronto', 'Vaughan', 'Markham', 'Montreal', 'Vancouver',
].map((name) => ({ '@type': 'City', name }));
const areaServedRegions = [
  { '@type': 'State', name: 'New York' },
  { '@type': 'City', name: 'Boston' },
  { '@type': 'City', name: 'Chicago' },
  { '@type': 'State', name: 'Texas' },
  { '@type': 'State', name: 'Florida' },
];

const offerCatalog = {
  '@type': 'OfferCatalog',
  name: 'Limestone, GFRC & Precast Products',
  itemListElement: [
    {
      '@type': 'OfferCatalog',
      name: 'Indiana Limestone Products',
      description: 'Columns, balusters, veneers, pavers, wall caps, keystones, sills, quoins, door surrounds, carving and more',
    },
    {
      '@type': 'OfferCatalog',
      name: 'GFRC Fabrication',
      description: 'Glass fiber reinforced concrete panels for facades, feature walls, fireplace surrounds, and custom architectural elements',
    },
    {
      '@type': 'OfferCatalog',
      name: 'Concrete Precast Products',
      description: 'Residential, commercial, and industrial precast concrete elements fabricated to specification',
    },
  ],
};

export const postalAddressSchema = (loc) => ({
  '@type': 'PostalAddress',
  streetAddress: streetLine(loc),
  addressLocality: loc.city,
  addressRegion: loc.region,
  postalCode: loc.postalCode,
  addressCountry: loc.country,
});

/**
 * LocalBusiness JSON-LD for one location. Fields still holding a
 * [TOKEN] (phone, hours, geo, GBP link) are omitted rather than
 * published as placeholder text.
 */
export const localBusinessSchema = (loc) => {
  const sameAs = [...(hasGbp(loc) ? [loc.gbpUrl] : []), ...company.sameAs];
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${locationUrl(loc)}#localbusiness`,
    name: company.name,
    alternateName: company.alternateName,
    description:
      'Premium Indiana Limestone fabrication and concrete precast for residential, commercial, and industrial projects across the Greater Toronto Area. Ontario Made certified.',
    url: locationUrl(loc),
    image: `${SITE_URL}${loc.heroImage}`,
    email: company.email,
    ...(hasPhone(loc) ? { telephone: loc.phone.e164 } : {}),
    address: postalAddressSchema(loc),
    ...(hasCoords(loc)
      ? { geo: { '@type': 'GeoCoordinates', latitude: loc.lat, longitude: loc.lng } }
      : {}),
    hasMap: loc.mapsUrl,
    areaServed: [...areaServed, ...areaServedRegions],
    priceRange: '$$$$',
    ...(hasHours(loc)
      ? {
          openingHoursSpecification: loc.hours.spec.map((s) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: s.days,
            opens: s.opens,
            closes: s.closes,
          })),
        }
      : {}),
    contactPoint: company.phones.map((p) => ({
      '@type': 'ContactPoint',
      telephone: p.e164,
      contactType: 'customer service',
    })),
    hasOfferCatalog: offerCatalog,
    sameAs,
    parentOrganization: {
      '@type': 'Organization',
      name: company.name,
      url: SITE_URL,
    },
  };
};
