---
name: Insight & Growth
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#444651'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#00311f'
  on-tertiary: '#ffffff'
  tertiary-container: '#004a31'
  on-tertiary-container: '#27c38a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 32px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for a high-trust, high-performance MOOC environment. The brand personality is **Academic Professionalism meets Modern SaaS Efficiency**. It aims to evoke feelings of clarity, progress, and institutional reliability. 

The aesthetic follows a **Corporate Modern** style: a disciplined approach to whitespace, high-quality typography, and a systematic use of depth. Now optimized for a **Light Mode** experience, the UI emphasizes clarity and readability, creating a "clean slate" for learning. The interface feels grounded and airy, utilizing subtle tonal shifts and precise borders to maintain an organized "Information Architecture as Art" aesthetic where the structure of the data provides the visual interest.

## Colors
The palette is anchored by a deep "University Blue" (Primary) that maintains authority and professional trust. The Teal (Secondary) provides high-contrast interactive elements that guide the user's eye toward action against the light background.

- **Primary (#1E3A8A):** Used for navigation, primary headers, and high-emphasis brand moments.
- **Secondary (#0D9488):** Dedicated to interactive success states and specialized learning tracks.
- **Surface Tiers:** Uses a clean white or off-white base, with subtle grey surface-container variations for cards and interactive containers to create a distinct hierarchy.
- **Semantic Colors:** Green (Accent), Amber (Warning), and Red (Danger) are used for status badges and feedback loops, calibrated for high legibility on light surfaces.

## Typography
This design system utilizes **Inter** exclusively to maintain a systematic, utilitarian, and highly readable interface across all screen sizes. 

- **Hierarchy:** Use `display-lg` for landing page heros. `headline-lg` and `headline-md` are reserved for dashboard sections and course titles.
- **Readability:** Body text is set with a generous line-height (1.5x). In light mode, high-contrast dark grey or black text is used to ensure long-form course descriptions are easy to consume.
- **Micro-copy:** Labels use a medium weight and slightly increased letter spacing to differentiate them from interactive body text.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop, transitioning to a **4-column grid** for mobile. 

- **The 8px Rule:** All dimensions, padding, and margins must be multiples of 8px to ensure a consistent visual rhythm.
- **Dashboard Layout:** Use a fixed-width left sidebar (280px) for navigation on desktop, while the main content area remains fluid with a max-width of 1280px to prevent line lengths from becoming unreadable on ultra-wide monitors.
- **Negative Space:** Generous vertical spacing (`stack-lg`) should be used between major sections to reduce cognitive load during the learning experience.

## Elevation & Depth
In this light mode configuration, depth is conveyed through **Tonal Layers** and subtle ambient shadows where raised surfaces appear to cast soft shadows on the layers below.

- **Level 0 (Base):** White or near-white background. 
- **Level 1 (Cards):** Light grey surface-container background. Note the use of subtle borders and soft shadows to define boundaries.
- **Level 2 (Dropdowns/Modals):** High-elevation surface with a distinct, diffused shadow to provide separation from the primary content layer.
- **Interaction:** On hover, cards should slightly darken their background color or increase shadow depth to signify interactivity.

## Shapes
The shape language is **Rounded**, using a systematic approach to corner radii to feel approachable yet structured.

- **Standard Elements:** Buttons, input fields, and small chips use `0.5rem` (rounded).
- **Containers:** Course cards, dashboard panels, and modals use `1rem` (rounded-lg) or `1.5rem` (rounded-xl) to emphasize a soft, modern SaaS feel.
- **Icons:** Use a consistent 2px stroke weight with slightly rounded caps to match the UI container language.

## Components
- **Buttons:** Primary buttons use a solid #1E3A8A fill with white text. Secondary buttons use a #0D9488 outline or subtle tint. All buttons should have a minimum height of 48px for accessibility.
- **Course Cards:** Utilize the `rounded-xl` shape. They must include a thumbnail with a 16:9 aspect ratio, a progress bar at the bottom, and clear metadata (instructor, duration).
- **Progress Bars:** Use a dual-tone approach. The track is a light, low-opacity version of the primary color, and the fill is the Secondary Teal (#0D9488) to signify active growth.
- **Input Fields:** Use a subtle 1px border (#6B7280). On focus, the border transitions to Primary Blue with a subtle outer glow.
- **Status Badges:** Use "Pill" shapes with low-opacity background fills of the semantic colors (e.g., a 10-20% opacity green background for a "Completed" badge).
- **Data Tables:** Clean, no vertical borders. Use horizontal dividers only and ensure the header row is sticky with a Level 1 elevation (tinted background) on scroll.