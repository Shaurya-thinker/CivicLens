import { useEffect, useState } from "react";
import API from "../services/api";
import ComplaintCard from "../components/ComplaintCard";

function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/complaints/my");

        // Ensure it's always an array
        if (Array.isArray(res.data)) {
          setComplaints(res.data);
        } else if (res.data?.complaints) {
          setComplaints(res.data.complaints);
        } else {
          setComplaints([]);
        }

      } catch (err) {
        setError("Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="container">Loading...</div>;

  if (error)
    return (
      <div className="container">
        <div className="error-message">{error}</div>
      </div>
    );

  return (
    <div className="container">
      <h2>My Complaints</h2>

      <div className="complaints-list">
        {complaints.length === 0 ? (
          <p>No complaints found.</p>
        ) : (
          complaints.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))
        )}
      </div>
    </div>
  );
}

export default MyComplaints;