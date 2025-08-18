import { buildCollection, buildProperty } from "@firecms/core";

// Portfolio collection schema
export const portfolioCollection = buildCollection({
  id: "portfolio",
  name: "Portfolio",
  singularName: "Portfolio Item",
  path: "portfolio",
  permissions: ({ authController }: any) => ({
    edit: true,
    create: true,
    delete: true
  }),
  properties: {
    title: buildProperty({
      name: "Title",
      dataType: "string",
      validation: { required: true }
    }),
    description: buildProperty({
      name: "Description",
      dataType: "string",
      multiline: true
    }),
    category: buildProperty({
      name: "Category",
      dataType: "string",
      enumValues: {
        "graphic-design": "Graphic Design",
        "exhibition": "Exhibition",
        "photography": "Photography",
        "illustration": "Illustration",
        "art": "Art",
        "branding": "Branding",
        "web-design": "Web Design"
      }
    }),
    image: buildProperty({
      name: "Featured Image",
      dataType: "string",
      storage: {
        storagePath: "portfolio",
        acceptedFiles: ["image/*"],
        maxSize: 5 * 1024 * 1024 // 5MB
      }
    }),
    gallery: buildProperty({
      name: "Image Gallery",
      dataType: "array",
      of: {
        dataType: "string",
        storage: {
          storagePath: "portfolio/gallery",
          acceptedFiles: ["image/*"]
        }
      }
    }),
    published: buildProperty({
      name: "Published",
      dataType: "boolean",
      defaultValue: false
    }),
    order: buildProperty({
      name: "Display Order",
      dataType: "number"
    }),
    createdAt: buildProperty({
      name: "Created",
      dataType: "date",
      autoValue: "on_create"
    })
  }
});

// About page collection
export const aboutCollection = buildCollection({
  id: "about",
  name: "About",
  singularName: "About Content",
  path: "about",
  properties: {
    title: buildProperty({
      name: "Section Title",
      dataType: "string",
      validation: { required: true }
    }),
    content: buildProperty({
      name: "Content",
      dataType: "string",
      multiline: true,
      markdown: true
    }),
    image: buildProperty({
      name: "Profile Image",
      dataType: "string",
      storage: {
        storagePath: "about",
        acceptedFiles: ["image/*"]
      }
    }),
    order: buildProperty({
      name: "Display Order",
      dataType: "number"
    })
  }
});

// Contact collection
export const contactCollection = buildCollection({
  id: "contact",
  name: "Contact",
  singularName: "Contact Info",
  path: "contact",
  properties: {
    email: buildProperty({
      name: "Email",
      dataType: "string",
      validation: { required: true, email: true }
    }),
    phone: buildProperty({
      name: "Phone",
      dataType: "string"
    }),
    address: buildProperty({
      name: "Address",
      dataType: "string",
      multiline: true
    }),
    socialMedia: buildProperty({
      name: "Social Media",
      dataType: "map",
      properties: {
        instagram: buildProperty({
          name: "Instagram",
          dataType: "string"
        }),
        linkedin: buildProperty({
          name: "LinkedIn",
          dataType: "string"
        }),
        twitter: buildProperty({
          name: "Twitter",
          dataType: "string"
        })
      }
    })
  }
});

// Site settings collection
export const settingsCollection = buildCollection({
  id: "settings",
  name: "Settings",
  singularName: "Site Setting",
  path: "settings",
  properties: {
    siteName: buildProperty({
      name: "Site Name",
      dataType: "string",
      validation: { required: true }
    }),
    siteDescription: buildProperty({
      name: "Site Description",
      dataType: "string",
      multiline: true
    }),
    logo: buildProperty({
      name: "Logo",
      dataType: "string",
      storage: {
        storagePath: "settings",
        acceptedFiles: ["image/*"]
      }
    }),
    favicon: buildProperty({
      name: "Favicon",
      dataType: "string",
      storage: {
        storagePath: "settings",
        acceptedFiles: ["image/*"]
      }
    }),
    seoKeywords: buildProperty({
      name: "SEO Keywords",
      dataType: "array",
      of: {
        dataType: "string"
      }
    })
  }
});

export const cmsConfig = {
  collections: [
    portfolioCollection,
    aboutCollection,
    contactCollection,
    settingsCollection
  ]
};