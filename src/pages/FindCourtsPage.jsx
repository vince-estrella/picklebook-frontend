import { useEffect, useState } from 'react'
import api from '../services/api'

function FindCourtsPage() {
  const [courts, setCourts] = useState([])

  useEffect(() => {
    api.get('/courts')
      .then(res => setCourts(res.data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-green-600 mb-6">Find Courts</h1>
      {courts.length === 0 ? (
        <p>No courts found.</p>
      ) : (
        courts.map(court => (
          <div key={court.id} className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-bold">{court.name}</h2>
            <p>{court.address}</p>
            <p className="text-green-600 font-semibold">₱{court.pricePerHour}/hr</p>
          </div>
        ))
      )}
    </div>
  )
}

export default FindCourtsPage