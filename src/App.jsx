import { useState } from 'react'
import './App.css'
import AparthotelForm from './HomeCorousal/AparthotelForm'
import ReviewForm from './ReviewCustomer/ReviewForm'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
       {/* <AparthotelForm/> */}
       <ReviewForm/>
      </div>
    
    </>
  )
}

export default App
