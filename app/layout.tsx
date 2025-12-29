// import './globals.css'; error when yarn build
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'My Blog',
  description: 'Personal blog',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' style={{ height: '100%', overflow: 'hidden' }}>
      <body
        style={{
          height: '100%',
          margin: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily:
            '"Palatino Linotype", Palatino, "Book Antiqua", Baskerville, "Times New Roman", serif',
        }}
      >
        <Navbar />
        <main
          style={{
            padding: '20px',
            flex: 1,
            overflow: 'hidden',
            maxWidth: '800px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
