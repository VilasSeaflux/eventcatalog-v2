/** @type {import('@eventcatalog/core/bin/eventcatalog.config').Config} */
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default {
  title: 'EventCatalog',
  tagline: 'This internal platform provides a comprehensive view of our event-driven architecture across all systems. Use this portal to discover existing domains, explore services and their dependencies, and understand the message contracts that connect our infrastructure',
  organizationName: 'Altodia',
  homepageLink: 'https://eventcatalog.dev/',
  editUrl: 'https://github.com/boyney123/eventcatalog-demo/edit/master',
  output: "server",
  // By default set to false, add true to get urls ending in /
  trailingSlash: false,
  // Change to make the base url of the site different, by default https://{website}.com/docs,
  // changing to /company would be https://{website}.com/company/docs,
  base: '/',
  // Customize the logo, add your logo to public/ folder
  logo: {
    alt: 'EventCatalog Logo',
    src: '/logo.png',
    text: 'EventCatalog'
  },
sidebar: [
  {
    id: '/chat',
    // This will hide the AI chat feature
    visible: false,
  }
],
  docs: {
    sidebar: {
      type: 'LIST_VIEW'
    },
  },
  generators:[
    [
      "@eventcatalog/generator-openapi",
      {
        services: [
          { path: path.join(__dirname, "services/Subscriptions/", "openapi.yml"),id: "Subscriptions" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
      },
      {
        services: [
          { path: path.join(__dirname, "services/Customers/", "openapi.yml"),id: "Customers" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
      },
      {
        services: [
          { path: path.join(__dirname, "services/Docstore/", "openapi.yml"),id: "Docstore" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
      },
      {
        services: [
          { path: path.join(__dirname, "services/Email/", "openapi.yml"),id: "Email" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
      },
      {
        services: [
          { path: path.join(__dirname, "services/Files/", "openapi.yml"),id: "Files" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
      },
      {
        services: [
          { path: path.join(__dirname, "services/Message/", "openapi.yml"),id: "Message" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
      },
      {
        services: [
          { path: path.join(__dirname, "services/Models/", "openapi.yml"),id: "Models" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
      },
      {
        services: [
          { path: path.join(__dirname, "services/Payments/", "openapi.yml"),id: "Payments" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
      },
      {
        services: [
          { path: path.join(__dirname, "services/Tokens/", "openapi.yml"),id: "Tokens" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
      },
    ],
    
    [
      "@eventcatalog/generator-asyncapi",
      {
        services: [
          { path: path.join(__dirname, "services/Subscriptions/", "asyncapi.yml"),id: "Subscriptions" },
        ],
        domain: { id: "Tech", name: "Tech", version: "0.0.1" },
        debug: false
      },
    ],
  ],
  // Enable RSS feed for your eventcatalog
  rss: {
    enabled: true,
    // number of items to include in the feed per resource (event, service, etc)
    limit: 20
  },
  // required random generated id used by eventcatalog
  cId: 'bb51962a-567b-4b30-9bb2-99a7ac0315db',
  visualiser: {
    channels: {
      // The render mode for channels in the visualiser
      // supports `flat` or `single`
      renderMode: 'flat'
    }
  },
}
