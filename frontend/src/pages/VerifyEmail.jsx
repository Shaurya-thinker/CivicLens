import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";
import AuthAnimatedBg from "../components/AuthAnimatedBg";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verify = async () => {
      try {
        const response = await API.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        setStatus("success");
        setMessage(response.data?.message || "Email verified successfully.");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Verification failed. The link may have expired.");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="page-with-bg">
      <AuthAnimatedBg />
      <div className="page-content auth-container">
        <div className="auth-card" style={{ maxWidth: "560px", textAlign: "center" }}>
          <h2>Email Verification</h2>
          <p style={{ marginBottom: "1.25rem" }}>{message}</p>

          {status === "loading" && (
            <div style={{ color: "var(--neutral-medium)", fontWeight: 600 }}>Please wait...</div>
          )}

          {status === "success" && (
            <Link to="/login" style={{ textDecoration: "none" }}>
              <button className="btn-primary">Go to Login</button>
            </Link>
          )}

          {status === "error" && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link to="/register" style={{ textDecoration: "none" }}>
                <button className="btn-filter">Register Again</button>
              </Link>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <button className="btn-primary">Go to Login</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
