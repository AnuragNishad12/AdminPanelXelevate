import { useState } from 'react'
import './App.css'
import AparthotelForm from './HomeCorousal/AparthotelForm'
import ReviewForm from './ReviewCustomer/ReviewForm'
import AircraftForm from './AircraftForm/AircraftForm'
import CarForm from './Car/CarForm'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
       {/* <AparthotelForm/> */}
       {/* <ReviewForm/> */}
       {/* <AircraftForm/> */}
       <CarForm/>
      </div>
    
    </>
  )
}

export default App
