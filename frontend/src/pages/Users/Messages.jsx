import React from 'react'
import Navbar from '../../components/Navbar'
import { useContext } from "react";
import { AppContext } from "../../context/Theme-Context.js";

const Messages = () => {
  const { isDark } = useContext(AppContext);
  return (
    <>
    <div >
      <div className="navbar">
        <Navbar/>
      </div>
      <div className='left'></div>
      <div className='right'></div>

    </div>
    </>
  )
}

export default Messages
