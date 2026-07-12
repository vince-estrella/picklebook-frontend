import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function FindCourtsPage() {
  const [courts, setCourts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/courts')
      .then(res => setCourts(res.data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pickleball Courts in Cebu
        </h1>
        <p className="text-gray-500 mb-8">Find and book courts near you</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map(court => (
            <div
              key={court.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Court Image */}
              <div className="relative h-48 bg-gray-200">
                {court.images && court.images.length > 0 ? (
                  <img
                    src={court.images[0].imageUrl}
                    alt={court.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
                <span className="absolute top-3 right-3 bg-white text-gray-900 text-sm font-semibold px-3 py-1 rounded-full">
                  ₱{court.pricePerHour}/hr
                </span>
              </div>

              {/* Court Info */}
              <div className="p-4">
                <h2 className="font-bold text-gray-900 text-lg">{court.name}</h2>
                <p className="text-gray-500 text-sm mb-3">📍 {court.address}</p>

                {/* Tags */}
                <div className="flex gap-2 mb-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {court.type}
                  </span>
                  {court.amenities && court.amenities.split(',').slice(0, 1).map(a => (
                    <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {a.trim()}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate(`/courts/${court.id}`)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FindCourtsPage