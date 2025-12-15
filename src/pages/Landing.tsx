import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/cspog-logo-full.jpg";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in, if so redirect to home
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/home");
      }
    });
  }, [navigate]);

  const handleLogoClick = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <img
          src={logo}
          alt="C-SPOG Logo"
          className="cursor-pointer hover:opacity-80 transition-opacity duration-200 mx-auto"
          style={{ width: "600px", maxWidth: "90vw" }}
          onClick={handleLogoClick}
        />
        <p className="text-muted-foreground mt-6 text-sm">
          Click the logo to login
        </p>
      </div>
    </div>
  );
}
