export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://virosentrepreneurs.com/#organization",
    "name": "VIROS Entrepreneurs",
    "legalName": "VIROS Entrepreneurs",
    "url": "https://virosentrepreneurs.com",
    "logo": "https://virosentrepreneurs.com/logo.png",
    "description": "Leading provider of AIDC solutions including industrial barcode printers, scanners, RFID readers, mobile computers, and warehouse management software.",
    "foundingDate": "2015",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXX-XXX-XXXX",
      "contactType": "Sales",
      "email": "sales@virosentrepreneurs.com",
      "availableLanguage": ["English", "Hindi"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
      "addressRegion": "India"
    },
    "sameAs": [
      "https://www.linkedin.com/company/viros-entrepreneurs",
      "https://www.facebook.com/virosentrepreneurs"
    ]
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://virosentrepreneurs.com/#business",
    "name": "VIROS Entrepreneurs",
    "image": "https://virosentrepreneurs.com/logo.png",
    "description": "Authorized distributor and service provider for Zebra, Honeywell, TSC, and Sato barcode printers, scanners, RFID readers, and enterprise mobility solutions.",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    }
  };

  const productsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "Product",
        "name": "Industrial Barcode Printers",
        "description": "High-performance industrial barcode and label printers from Zebra, TSC, Sato, and Honeywell",
        "brand": {
          "@type": "Brand",
          "name": "Zebra, Honeywell, TSC, Sato"
        },
        "category": "Barcode Printers"
      },
      {
        "@type": "Product",
        "name": "Barcode Scanners",
        "description": "Handheld, fixed mount, and wireless barcode scanners with 1D and 2D imaging capabilities",
        "brand": {
          "@type": "Brand",
          "name": "Honeywell, Zebra"
        },
        "category": "Barcode Scanners"
      },
      {
        "@type": "Product",
        "name": "RFID Readers & Tags",
        "description": "UHF RFID readers, tags, and complete tracking solutions for inventory and asset management",
        "category": "RFID Technology"
      },
      {
        "@type": "Product",
        "name": "Mobile Computers",
        "description": "Rugged Android mobile computers and PDAs for warehouse and field operations",
        "brand": {
          "@type": "Brand",
          "name": "Zebra, Honeywell"
        },
        "category": "Mobile Computing"
      },
      {
        "@type": "Product",
        "name": "Warehouse Management Software",
        "description": "Complete WMS solutions for inventory tracking, asset management, and warehouse automation",
        "category": "Software Solutions"
      }
    ]
  };

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "AIDC Solutions",
    "provider": {
      "@type": "Organization",
      "name": "VIROS Entrepreneurs"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "AIDC Solutions & Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Hardware Solutions",
            "description": "Industrial barcode printers, scanners, mobile computers, and RFID readers"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Software Solutions",
            "description": "Warehouse management systems, inventory tracking, and asset management software"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Consumables",
            "description": "Thermal transfer ribbons, barcode labels, and printer supplies"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Installation & Support",
            "description": "Professional installation, configuration, training, and technical support"
          }
        }
      ]
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://virosentrepreneurs.com"
      }
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://virosentrepreneurs.com/#website",
    "url": "https://virosentrepreneurs.com",
    "name": "VIROS Entrepreneurs",
    "description": "Leading AIDC solutions provider offering barcode printers, scanners, RFID readers, mobile computers, and warehouse management software",
    "publisher": {
      "@id": "https://virosentrepreneurs.com/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://virosentrepreneurs.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
