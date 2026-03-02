import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function RaiseComplaint() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    let newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!form.category) {
      newErrors.category = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    // Remove the field-specific error on change
    setErrors((prev) => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);

    try {
      await api.post("/complaints", form);
      navigate("/my-complaints");
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        "Failed to submit complaint. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      {serverError && (
        <div className="error-message" style={{ maxWidth: "600px", margin: "0 auto 1rem" }}>{serverError}</div>
      )}

      <form className="auth-card" onSubmit={handleSubmit} noValidate style={{ maxWidth: "600px", margin: "0 auto" }}>

          {/* TITLE */}
          <div className="form-group">
            <label>Complaint Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter Complaint Title"
              value={form.title}
              onChange={handleChange}
            />
            {errors.title && (
              <small style={{ color: "var(--error)" }}>
                {errors.title}
              </small>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={handleChange}
              rows="4"
              style={{
                width: "100%",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: "2px solid var(--neutral-lighter)"
              }}
            />
            {errors.description && (
              <small style={{ color: "var(--error)" }}>
                {errors.description}
              </small>
            )}
          </div>

          {/* CATEGORY */}
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: "2px solid var(--neutral-lighter)"
              }}
            >
              <option value="">Select Category</option>
              <option value="Road">Road</option>
              <option value="Garbage">Garbage</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electricity">Electricity</option>
              <option value="Street Light">Street Light</option>
              <option value="Other">Other</option>
            </select>

            {errors.category && (
              <small style={{ color: "var(--error)" }}>
                {errors.category}
              </small>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
    </div>
  );
}