import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import eventImage from "../assets/poster2.jpg";

function EventSelection() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3000/api/events")
      .then(response => setEvents(response.data))
      .catch(error => console.error("Error fetching events:", error));
  }, []);

  return (
    <div className="EventSelection">
      <div className="EventInfo">
        <h1>Welcome<br/>to Tuk-Tuk <br></br>Tour Ticket System</h1>
        <h2>Select Your Event</h2>
        <div className="SelectButton">
          {events.map(event => (
            <button 
              key={event.id} 
              onClick={() => navigate(`/create-qr/${event.id}`)}
              disabled={event.tickets === 0}
            >
              {event.name}
            </button>
          ))}
        </div>
      </div>
      <img src={eventImage} alt="Event" />
    </div>
  );
}

export default EventSelection;