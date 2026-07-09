import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
      <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
        🏓 PickleBook
      </Link>
      <div className="flex items-center gap-6">
        <Link
          to="/courts"
          className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
        >
          Find Courts
        </Link>
        <Link
          to="/owner/login"
          className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Book Now
        </Link>
      </div>
    </nav>
  )
}

export default Navbar