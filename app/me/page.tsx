'use client';

export default function Me() {
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        maxWidth: 1000,
        margin: '0 auto',
        padding: '40px 20px',
      }}
    >
      {/* Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 40,
          marginBottom: 40,
        }}
      >
        {/* Left Column - Name and Contact */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Name */}
          <div>
            <h1
              style={{
                fontSize: '1.4em',
                marginBottom: 4,
                color: '#333',
              }}
            >
              Khuat Hieu
              <span
                style={{
                  fontSize: '0.9em',
                  color: '#666',
                  marginTop: 0,
                  marginLeft: 8,
                  marginBottom: 0,
                }}
              >
                (Ceuli)
              </span>
            </h1>
          </div>

          {/* GitHub */}
          <a
            href='https://github.com/Khuathieu96'
            target='_blank'
            rel='noopener noreferrer'
            style={{
              display: 'flex',
              alignItems: 'center',

              color: '#333',
              textDecoration: 'none',
              fontSize: '0.9em',
            }}
          >
            github.com/Khuathieu96
          </a>

          {/* Website */}
          <a
            href='https://hieukhuat.vercel.app'
            target='_blank'
            rel='noopener noreferrer'
            style={{
              display: 'flex',
              alignItems: 'center',

              color: '#333',
              textDecoration: 'none',
              fontSize: '0.9em',
            }}
          >
            hieukhuat.vercel.app
          </a>

          {/* Email */}
          <a
            href='mailto:khuathieu96@gmail.com'
            style={{
              display: 'flex',
              alignItems: 'center',

              color: '#333',
              textDecoration: 'none',
              fontSize: '0.9em',
            }}
          >
            khuathieu96@gmail.com
          </a>
        </div>

        {/* Right Column - About Me */}
        <section>
          <p
            style={{
              fontSize: '0.95em',
              lineHeight: 1.7,
              color: '#555',
              padding: 20,
              borderLeft: '3px solid #ddd',
              backgroundColor: '#f9f9f9',
            }}
          >
            Builds complete solutions holistically—from ideation to
            deployment—by selecting optimal tools and driving real impact.
          </p>
        </section>
      </div>

      {/* Work Experience */}
      <section style={{ marginBottom: 32, paddingBottom: 16 }}>
        <h2 style={{ fontSize: '1.2em', marginBottom: 16, color: '#333' }}>
          Work Experience
        </h2>

        {/* EWOOSOFT VIET */}
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 16,
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
              Software Developer
            </h3>
            <span style={{ fontSize: '0.85em', color: '#666' }}>
              03/2020 - Present
            </span>
          </div>

          <p
            style={{
              fontSize: '0.9em',
              color: '#666',
              fontStyle: 'italic',
              margin: '4px 0 8px 0',
            }}
          >
            EWOOSOFT VIET company
          </p>

          <p
            style={{
              fontSize: '0.9em',
              color: '#555',
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            <strong>Dental clinic-n-lab:</strong> Build a dental examination and
            treatment system.
          </p>

          <div>
            <strong style={{ color: '#333', fontSize: '0.85em' }}>
              Achievements/Tasks:
            </strong>
            <ul
              style={{
                marginTop: 8,
                marginBottom: 0,
                paddingLeft: 20,
                color: '#666',
                fontSize: '0.875em',
                lineHeight: 1.7,
              }}
            >
              <li>
                Worked on researching the dental hospital business related to
                patient record management, appointment booking, hospital fee
                payment.
              </li>
              <li>
                Collaborated with the developer and product planner team in
                Korea to build a dental lab application that links to a dental
                clinic to take orders and deliver dental materials using
                Reactjs, React-intl, MaterialUI.
              </li>
              <li>
                Integrated Zalo's API, a messaging and calling application, to
                create a doctor-and-patient contact system.
              </li>
              <li>
                Developed the chat component using subscriptions of Apollo
                GraphQL and Slatejs.
              </li>
              <li>
                Virtualized large lists to show a maximum of 10000 records of
                appointment history using React-virtualized.
              </li>
            </ul>
          </div>
        </div>

        {/* CMC Global */}
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 16,
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
              Front-end Web Developer
            </h3>
            <span style={{ fontSize: '0.85em', color: '#666' }}>
              06/2021 - 10/2021
            </span>
          </div>

          <p
            style={{
              fontSize: '0.9em',
              color: '#666',
              fontStyle: 'italic',
              margin: '4px 0 8px 0',
            }}
          >
            CMC Global company
          </p>

          <p
            style={{
              fontSize: '0.9em',
              color: '#555',
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            <strong>Video Conferencing:</strong> Build a video platform, support
            meetings, webinars, and events.
          </p>

          <div>
            <strong style={{ color: '#333', fontSize: '0.85em' }}>
              Achievements/Tasks:
            </strong>
            <ul
              style={{
                marginTop: 8,
                marginBottom: 0,
                paddingLeft: 20,
                color: '#666',
                fontSize: '0.875em',
                lineHeight: 1.7,
              }}
            >
              <li>
                Built responsive user interface of conference screen using
                Vuejs, SCSS, Typescript.
              </li>
              <li>
                Collaborated with a backend developer to handle functions:
                create a meeting, add participants, mute/unmute video/audio
                using Jitsi's API.
              </li>
            </ul>
          </div>
        </div>

        {/* Novaon digital */}
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
              Software Developer
            </h3>
            <span style={{ fontSize: '0.85em', color: '#666' }}>
              03/2018 - 02/2020
            </span>
          </div>

          <p
            style={{
              fontSize: '0.9em',
              color: '#666',
              fontStyle: 'italic',
              margin: '4px 0 8px 0',
            }}
          >
            Novaon digital group company
          </p>

          <p
            style={{
              fontSize: '0.9em',
              color: '#555',
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            <strong>Landingpage:</strong> Help non-tech people create the
            website by manipulating the browser.
          </p>

          <div>
            <strong style={{ color: '#333', fontSize: '0.85em' }}>
              Achievements/Tasks:
            </strong>
            <ul
              style={{
                marginTop: 8,
                marginBottom: 0,
                paddingLeft: 20,
                color: '#666',
                fontSize: '0.875em',
                lineHeight: 1.7,
              }}
            >
              <li>
                Built drag-and-drop components, within a agile team, using
                Reactjs, React-dnd, ReduxJs that created 100+ website template
                in a month.
              </li>
              <li>
                Developed a text editor including 4 tools (styling, emoji,
                mention, font) using Draftjs, Emoji one.
              </li>
              <li>
                Delivered monitoring app with Bootstrap, Nextjs, Google Chart
                API.
              </li>
              <li>
                Applied queries and mutations of Relayjs and GraphQL, reduced
                the requests by more than 50%.
              </li>
              <li>
                Researched Cloudinary API and implemented an image library,
                reduced budget image processing server by 20% in a month.
              </li>
              <li>
                Optimized the size of image and JS files on landing pages to
                achieve more than 95 PageSpeed Insights point (PSI).
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
