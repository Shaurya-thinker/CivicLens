import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";

export default function PublicDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await api.get("/complaints");
      const data = response.data.complaints || response.data;
      setComplaints(data);

      const total = data.length;
      const resolved = data.filter((c) => c.status === "Resolved").length;
      const pending = data.filter((c) => c.status === "Pending").length;
      const inProgress = data.filter(
        (c) => c.status === "In Progress"
      ).length;

      setStats({ total, resolved, pending, inProgress });
    } catch (err) {
      setError("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p>Loading complaints...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Public Complaint Dashboard</h1>
      <p>View all submitted complaints and their resolution status</p>

      {/* ACTION BUTTONS */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          margin: "25px 0",
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/raise"
          className="btn-primary"
          style={{ width: "fit-content", padding: "12px 25px" }}
        >
          + Raise Complaint
        </Link>

        <Link
          to="/my-complaints"
          className="btn-primary"
          style={{
            width: "fit-content",
            padding: "12px 25px",
            background:
              "linear-gradient(135deg, #38a169 0%, #2f855a 100%)",
          }}
        >
          My Complaints
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Complaints</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Resolved</h3>
          <p className="stat-number resolved">{stats.resolved}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-number in-progress">
            {stats.inProgress}
          </p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number pending">{stats.pending}</p>
        </div>
      </div>

      <h2 style={{ marginTop: "40px" }}>Recent Complaints</h2>

      <div className="complaints-list">
        {complaints.slice(0, 10).map((complaint) => (
          <div key={complaint._id} className="complaint-item">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <h3>{complaint.title}</h3>
              <StatusBadge status={complaint.status} />
            </div>

            <p>{complaint.description}</p>

            <div className="complaint-meta">
              <span className="category">
                {complaint.category}
              </span>
              <span className="date">
                {new Date(
                  complaint.createdAt
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}