import { Link } from 'react-router-dom'

/**
 * 404 page - minimal matching KTT style
 */
function NotFoundPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-normal mb-2">404</h1>
      <p className="text-sm text-gray-600 mb-6">
        Page not found.
      </p>
      <Link to="/" className="btn">
        Go Home
      </Link>
    </div>
  )
}

export default NotFoundPage
