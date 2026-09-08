import './globals.css'

export const metadata = {
  title: 'Pixel Paradox: AI or Reality?',
  description: 'An interactive technical challenge event to distinguish authentic photos from AI-generated visuals.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="grid-overlay" />
        <div className="scanlines" />
        {children}
      </body>
    </html>
  )
}
