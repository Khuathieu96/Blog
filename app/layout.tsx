// import './globals.css'; error when yarn build

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
      <body style={{ 
        height: '100%', 
        margin: 0, 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", Baskerville, "Times New Roman", serif'
      }}>
        <header style={{ padding: '12px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
          <a href='/' style={{ fontWeight: 700 }}>
            My Blog
          </a>{' '}
          | <a href='/me'>About</a>
        </header>
        <main style={{ padding: '24px', flex: 1, overflow: 'hidden' }}>{children}</main>
      </body>
    </html>
  );
}
