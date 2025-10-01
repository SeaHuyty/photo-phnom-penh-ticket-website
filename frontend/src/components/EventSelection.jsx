import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import eventImage from "../assets/poster2.jpg";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function EventSelection() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${BASE_URL}/events`)
      .then(response => setEvents(response.data))
      .catch(error => console.error("Error fetching events:", error));
  }, []);

  return (
    <div className="flex justify-between rounded-lg">
      <div className="text-left my-20 mx-10 text-white">
        <h1 className="text-uppercase text-3xl text-bold">Welcome<br/>to Tuk-Tuk <br></br>Tour Ticket System</h1>
        <h2 className="mt-5">Select Your Event</h2>
        <div className="mt-5 grid grid-cols-2 gap-5 justify-center">
          {events.map(event => (
            <button 
              key={event.id} 
              onClick={() => navigate(`/create-qr/${event.id}`)}
              disabled={event.tickets === 0}
              className="cursor-pointer rounded-lg bg-white/20 px-5 py-3 hover:bg-white/30 transition-all duration-200 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {event.name}
            </button>
          ))}
        </div>
      </div>
      <img src={eventImage} alt="Event" className="rounded-lg w-[40%]" />
    </div>
  );
}

export default EventSelection;