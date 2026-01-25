import { Link } from 'react-router-dom'

/**
 * About page - minimal bio matching KTT style
 */
function AboutPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-normal mb-8">About</h1>

      <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
        <p>
          Kristian Talley is a visual artist working primarily in pen and ink,
          illustration, and mixed media. Based in the United States.
        </p>

        <p>
          The work explores themes of solitude, introspection, and the human
          figure through expressive linework and crosshatching techniques.
          Each piece is created by hand with careful attention to craft.
        </p>

        <p>
          Original drawings and limited edition prints are available through
          the shop. For commissions, collaborations, or other inquiries,
          please get in touch.
        </p>
      </div>

      <div className="separator" />

      <div className="space-y-4 text-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">
            Contact
          </span>
          <a
            href="mailto:talleykristian@gmail.com"
            className="hover:text-gray-500"
          >
            talleykristian@gmail.com
          </a>
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">
            Portfolio
          </span>
          <a
            href="https://kristiantalley.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-500"
          >
            kristiantalley.com
          </a>
        </div>
      </div>

      <div className="separator" />

      <Link to="/shop" className="btn">
        View Shop
      </Link>
    </div>
  )
}

export default AboutPage
