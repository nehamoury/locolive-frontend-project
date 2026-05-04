import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'Locolive';
const DEFAULT_DESCRIPTION = 'Discover people, stories, and moments around you. Locolive is a location-based social platform where proximity connects you to the world.';
const DEFAULT_IMAGE = 'https://locolive.appnity.co.in/og-image.png';
const DEFAULT_URL = 'https://locolive.appnity.co.in';

export const SEOHead = ({
  title,
  description,
  image,
  url,
  type = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const pageTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  const pageDesc = description || DEFAULT_DESCRIPTION;
  const pageImage = image || DEFAULT_IMAGE;
  const pageUrl = url || DEFAULT_URL;
  const robots = noIndex ? 'noindex, nofollow' : 'index, follow';

  return (
    <Helmet>
      {/* Primary */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || DEFAULT_TITLE} />
      <meta property="og:site_name" content={DEFAULT_TITLE} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:image:alt" content={title || DEFAULT_TITLE} />
    </Helmet>
  );
};
