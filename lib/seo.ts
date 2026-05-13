export const SITE_NAME = "L.A.P - Docs";
export const SITE_ALTERNATE_NAMES = ["L.A.P Docs", "LAP Docs"];
export const SITE_URL = "https://lap.onl";
export const SITE_HOME_URL = `${SITE_URL}/`;
export const SITE_HOST = new URL(SITE_URL).host;
export const SITE_LOCALE = "en_US";
export const SITE_LANGUAGE = "en-US";
export const SITE_DESCRIPTION =
  "Step-by-step technical docs, tutorials, and guides from the L.A.P YouTube channel.";
export const SITE_LOGO_PATH = "/logos/LAP-Logo-Color.png";
export const DEFAULT_OG_IMAGE_PATH = "/og-image.png";
export const DEFAULT_TWITTER_IMAGE_PATH = "/twitter-image.png";
export const INDEXNOW_KEY = "ad84aef5c8d54425ab34d1d4f36a8d79";
export const SITE_ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const SITE_WEBSITE_ID = `${SITE_URL}/#website`;
export const SITE_SOCIAL_PROFILES = [
  "https://www.youtube.com/@lap-tutorials",
  "https://github.com/LAP-Tutorials",
  "https://www.instagram.com/lap.mgmt.team/",
  "https://www.tiktok.com/@lap_mgmt",
  "https://www.patreon.com/lap_mgmt",
];

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
}

export function buildTopicPath(label: string) {
  return `/topics/${slugifySegment(label)}`;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_WEBSITE_ID,
    url: SITE_HOME_URL,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    publisher: { "@id": SITE_ORGANIZATION_ID },
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": SITE_ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    url: SITE_HOME_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_LOGO_PATH),
    },
    image: absoluteUrl(SITE_LOGO_PATH),
    sameAs: SITE_SOCIAL_PROFILES,
    email: "mailto:contact@lap.onl",
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "contact@lap.onl",
        contactType: "customer support",
        url: absoluteUrl("/privacy-policy"),
      },
    ],
  };
}

export function buildPublisherSchema() {
  return {
    "@type": "Organization",
    "@id": SITE_ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_LOGO_PATH),
    },
  };
}
