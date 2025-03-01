import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function EventSelection() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3000/api/events")
      .then(response => setEvents(response.data))
      .catch(error => console.error("Error fetching events:", error));
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Select Your Event</h2>
      {events.map(event => (
        <button 
          key={event.id} 
          onClick={() => navigate(`/create-qr/${event.id}`)}
          disabled={event.tickets === 0}
          style={{ 
            margin: "10px", 
            padding: "10px 20px", 
            backgroundColor: event.tickets > 0 ? "#007bff" : "#ccc",
            color: "#fff",
            border: "none",
            cursor: event.tickets > 0 ? "pointer" : "not-allowed"
          }}
        >
          {event.name} ({event.tickets} left)
        </button>
      ))}
    </div>
  );
}

export default EventSelection;