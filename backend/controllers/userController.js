const { supabase } = require("../utils/supabaseClient");
const signup = async(req,res) =>{
    try {
    const { email } = req.body;
    const user_id = 123;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { data, error } = await supabase
      .from("users")
      .insert([{ user_id , email }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "User created successfully",
      user: {
        user_id: data.user_id,
        email: data.email,
        created_at: data.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {signup}