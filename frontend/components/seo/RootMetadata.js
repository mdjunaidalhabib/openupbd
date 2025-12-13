export const rootMetadata = {
  title: {
    default: "OpenUp BD – Online Shopping in Bangladesh",
    template: "%s | OpenUp BD",
  },
  description:
    "OpenUp BD is a trusted e-commerce platform in Bangladesh where you can buy quality products online at the best price.",
  keywords: [
    "openupbd",
    "ecommerce bangladesh",
    "online shopping bd",
    "buy online bangladesh",
  ],
  metadataBase: new URL("https://openupbd.com"),
  openGraph: {
    title: "OpenUp BD – Online Shopping Platform",
    description:
      "Buy quality products online in Bangladesh with fast delivery and trusted service.",
    url: "https://openupbd.com",
    siteName: "OpenUp BD",
    images: [
      {
        url: "/icon-512.png",
        width: 1200,
        height: 630,
        alt: "OpenUp BD Ecommerce",
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
  },
};
