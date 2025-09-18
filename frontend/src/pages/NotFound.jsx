import React from 'react'
import { useNavigate } from 'react-router-dom';


const NotFound = () => {
    const navigate = useNavigate();
  return (
    <div>
        <h1 className="text-4xl font-bold text-center mt-20">404 - Page Not Found</h1>
        <button onClick={navigate('/login')}> Return To Login </button>
    </div>
  )
}

export default NotFound