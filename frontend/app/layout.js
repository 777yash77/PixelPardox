import './globals.css'
import CustomCursor from '@/components/CustomCursor'

export const metadata = {
  title: 'Pixel Paradox: AI or Reality?',
  description: 'An interactive technical challenge event to distinguish authentic photos from AI-generated visuals.',
  themeColor: '#0A0607',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CustomCursor />
        <div className="grid-overlay" />
        <div className="scanlines" />
        {children}
      </body>
    </html>
  )
}
