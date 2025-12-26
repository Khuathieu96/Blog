'use client';

export default function Me() {
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        maxWidth: 900,
        margin: '0 auto',
        padding: '0 20px',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 48,
          paddingTop: 32,
          paddingBottom: 32,
          borderBottom: '1px solid #eee',
        }}
      >
        <h1
          style={{
            fontSize: '1.8em',
            marginBottom: 8,
            color: '#333',
          }}
        >
          Khuat Hieu
        </h1>
        <p
          style={{
            fontSize: '0.95em',
            color: '#666',
            marginTop: 0,
          }}
        >
          Ceuli
        </p>
      </div>

      {/* Introduction */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: '1.3em', marginBottom: 16, color: '#333' }}>
          About Me
        </h2>
        <p
          style={{
            fontSize: '0.95em',
            lineHeight: 1.7,
            color: '#555',
            padding: 20,
            borderLeft: '2px solid #ddd',
          }}
        >
          I'm a web developer with a passion for building scalable systems. My
          vision is to <strong>think about systems holistically</strong> and
          <strong> choose the right tools to solve problems effectively</strong>
          . I believe in writing clean, maintainable code and creating solutions
          that make a real impact.
        </p>
      </section>

      {/* Social Links */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: '1.3em', marginBottom: 16, color: '#333' }}>
          Connect With Me
        </h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <a
            href='https://github.com/Khuathieu96'
            target='_blank'
            rel='noopener noreferrer'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              border: '1px solid #ddd',
              color: '#333',
              textDecoration: 'none',
              borderRadius: 4,
              fontSize: '1.05em',
            }}
          >
            <span>GitHub: @Khuathieu96</span>
          </a>

          <a
            href='https://hieukhuat.vercel.app'
            target='_blank'
            rel='noopener noreferrer'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              border: '1px solid #ddd',
              color: '#333',
              textDecoration: 'none',
              borderRadius: 4,
              fontSize: '0.9em',
            }}
          >
            <span>Website: hieukhuat.vercel.app</span>
          </a>

          <a
            href='mailto:khuathieu96@gmail.com'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              border: '1px solid #ddd',
              color: '#333',
              textDecoration: 'none',
              borderRadius: 4,
              fontSize: '0.9em',
            }}
          >
            <span>Email: khuathieu96@gmail.com</span>
          </a>
        </div>
      </section>

      {/* Career Timeline */}
      <section style={{ marginBottom: 48, paddingBottom: 32 }}>
        <h2 style={{ fontSize: '1.3em', marginBottom: 24, color: '#333' }}>
          Career Journey
        </h2>

        {/* 2018-2020 Period */}
        <div
          style={{
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: '1px solid #eee',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 8,
            }}
          >
            <h3 style={{ fontSize: '1.05em', margin: 0, color: '#333' }}>
              Junior Developer
            </h3>
            <span style={{ fontSize: '0.85em', color: '#666' }}>
              2018 - 2020
            </span>
          </div>

          <p
            style={{
              fontSize: '0.9em',
              color: '#555',
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            Started my journey in web development, focusing on front-end
            technologies and learning the fundamentals of building modern web
            applications.
          </p>

          <div>
            <strong style={{ color: '#333', fontSize: '0.85em' }}>
              Key Focus:
            </strong>
            <ul
              style={{
                marginTop: 8,
                marginBottom: 0,
                paddingLeft: 20,
                color: '#666',
                fontSize: '0.875em',
              }}
            >
              <li>HTML, CSS, JavaScript fundamentals</li>
              <li>React.js and component-based architecture</li>
              <li>RESTful API integration</li>
              <li>Version control with Git</li>
            </ul>
          </div>
        </div>

        {/* 2020-Now Period */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 8,
            }}
          >
            <h3 style={{ fontSize: '1.05em', margin: 0, color: '#333' }}>
              Full-Stack Developer
            </h3>
            <span style={{ fontSize: '0.85em', color: '#666' }}>
              2020 - Present
            </span>
          </div>

          <p
            style={{
              fontSize: '0.9em',
              color: '#555',
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            Evolved into full-stack development, working with modern frameworks
            and databases. Focus on building scalable systems and choosing the
            right tools for each problem.
          </p>

          <div>
            <strong style={{ color: '#333', fontSize: '0.85em' }}>
              Key Focus:
            </strong>
            <ul
              style={{
                marginTop: 8,
                marginBottom: 0,
                paddingLeft: 20,
                color: '#666',
                fontSize: '0.875em',
              }}
            >
              <li>Next.js and server-side rendering</li>
              <li>MongoDB and database design</li>
              <li>System architecture and scalability</li>
              <li>API design and development</li>
              <li>Cloud deployment (Vercel, AWS)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
