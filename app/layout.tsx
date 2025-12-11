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
    <html lang='en'>
      <body>
        <header style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
          <a href='/' style={{ fontWeight: 700 }}>
            My Blog
          </a>{' '}
          | <a href='/me'>About</a> | <a href='/search'>Search</a> |{' '}
          <a href='/dashboard'>Dashboard</a>
        </header>
        <main style={{ padding: '24px' }}>{children}</main>
      </body>
    </html>
  );
}
