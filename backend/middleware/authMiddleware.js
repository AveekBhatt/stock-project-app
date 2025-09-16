const jwt = require("jsonwebtoken");
const { supabase } = require("../utils/supabaseClient"); 
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

async function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "Missing access token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.id)
      .single();

    if (error || !user) return res.status(404).json({ error: "User not found" });

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticateToken };
