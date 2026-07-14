const configuredSiteUrl = import.meta.env.VITE_SITE_URL as string | undefined;

export const SITE_URL = (configuredSiteUrl || "https://namflirt.com").replace(/\/$/, "");
export const SOCIAL_IMAGE_URL = `${SITE_URL}/images/someone-worth-meeting.png`;

type StructuredData = Record<string, unknown>;

type SeoHeadOptions = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  image?: string;
  structuredData?: StructuredData[];
};

export function seoHead({
  title,
  description,
  path,
  image = SOCIAL_IMAGE_URL,
  structuredData = [],
}: SeoHeadOptions) {
  const canonicalUrl = `${SITE_URL}${path}`;
  const meta = [
    { title },
    { name: "description", content: description },
    {
      name: "robots",
      content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "namflirt." },
    { property: "og:locale", content: "en_NA" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonicalUrl },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: "namflirt. dating across Namibia" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];

  return {
    meta,
    links: [{ rel: "canonical", href: canonicalUrl }],
    scripts: structuredData.map((data) => ({
      type: "application/ld+json",
      children: JSON.stringify(data),
    })),
  };
}

export function privateHead(title: string, description: string) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  };
}

export const homeStructuredData: StructuredData[] = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "namflirt.",
    alternateName: "Namflirt",
    url: SITE_URL,
    logo: `${SITE_URL}/namflirt_logo.png`,
    description:
      "A Namibia-first dating platform for single women and single men seeking meaningful local connections across cultures, languages and places.",
    areaServed: {
      "@type": "Country",
      name: "Namibia",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "namflirt.",
    alternateName: "Namflirt Namibia",
    url: SITE_URL,
    inLanguage: "en-NA",
    description:
      "Dating in Namibia for Namibian singles looking for thoughtful, genuine local connections.",
    keywords:
      "dating in Namibia, Namibian dating site, single women in Namibia, single men in Namibia, Namibia singles",
  },
];
