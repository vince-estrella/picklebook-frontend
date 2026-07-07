import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import FindCourtsPage from './pages/FindCourtsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/courts" element={<FindCourtsPage />} />
    </Routes>
  )
}

export default App