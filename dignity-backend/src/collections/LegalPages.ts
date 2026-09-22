import { pageCollection } from './AboutPages'

/**
 * The website's Disclaimer and Privacy Policy pages, linked from the footer's
 * bottom bar.
 *
 * Prose pages like The Dignity Research Initiative, so they take the same
 * shape: one document each, English and Arabic title and body. They sit in
 * the sidebar's Site group beside Site Settings, which holds the footer
 * links' own wording, since they belong to the site as a whole rather than to any
 * one menu.
 */
export const Disclaimer = pageCollection(
  'disclaimer',
  'Disclaimer',
  'Disclaimer',
  'The text of the website\'s Disclaimer page, linked from the bottom of every page. Open the entry below to edit it.',
  'Site',
)

/** The Privacy Policy page, linked beside the Disclaimer in the footer. */
export const PrivacyPolicy = pageCollection(
  'privacy-policy',
  'Privacy Policy',
  'Privacy Policy',
  'The text of the website\'s Privacy Policy page, linked from the bottom of every page. Open the entry below to edit it.',
  'Site',
)
