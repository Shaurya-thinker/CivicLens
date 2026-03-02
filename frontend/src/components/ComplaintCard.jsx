function ComplaintCard({ complaint }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        marginBottom: "15px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderLeft: "5px solid #2563eb",
      }}
    >
      <h3 style={{ marginBottom: "8px" }}>{complaint.title}</h3>

      <p style={{ marginBottom: "6px" }}>
        <strong>Description:</strong> {complaint.description}
      </p>

      <p style={{ marginBottom: "6px" }}>
        <strong>Category:</strong> {complaint.category}
      </p>

      <p style={{ marginBottom: "6px" }}>
        <strong>Status:</strong>{" "}
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "5px",
            fontSize: "12px",
            backgroundColor:
              complaint.status === "Resolved"
                ? "#d1fae5"
                : complaint.status === "In Progress"
                ? "#fef9c3"
                : "#fee2e2",
          }}
        >
          {complaint.status}
        </span>
      </p>

      <small style={{ color: "#666" }}>
        Created: {new Date(complaint.createdAt).toLocaleString()}
      </small>
    </div>
  );
}

export default ComplaintCard;