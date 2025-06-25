import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Розпізнавання через Plant.id
app.post('/identify', async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

  try {
    const response = await fetch("https://api.plant.id/v2/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": process.env.PLANT_ID_API_KEY
      },
      body: JSON.stringify({
        images: [imageBase64],
        modifiers: ["crops_fast", "similar_images"],
        plant_language: "en",
        plant_details: ["common_names", "url", "wiki_description"]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Plant.id error:", err);
    res.status(500).json({ error: 'Plant identification failed' });
  }
});

// Збереження визначеної рослини
app.post('/save', async (req, res) => {
  const { access_token, plant_name, image_url } = req.body;

  if (!access_token || !plant_name) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(access_token);

  if (authError || !userData?.user?.id) {
    console.error("Auth error:", authError);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user_id = userData.user.id;

  const { error } = await supabase
    .from('saved_plants')
    .insert({ user_id, plant_name, image_url: image_url || "" });

  if (error) {
    console.error("Insert error:", error);
    return res.status(500).json({ error: 'Insert failed' });
  }

  res.json({ success: true });
});

// Логін користувача через email + пароль
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session?.access_token) {
    console.error("Login error:", error);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    access_token: data.session.access_token,
    user_id: data.user.id
  });
});

// Реєстрація нового користувача
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email і пароль обовʼязкові' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error("Signup error:", error);
    return res.status(400).json({ error: error.message || 'Помилка реєстрації' });
  }

  res.json({
    user_id: data.user?.id,
    access_token: data.session?.access_token || null,
    message: "Реєстрація успішна"
  });
});

// Отримання збережених рослин користувача
app.get('/my-plants', async (req, res) => {
  const access_token = req.headers.authorization?.split("Bearer ")[1];

  if (!access_token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(access_token);

  if (authError || !userData?.user?.id) {
    console.error("Auth error:", authError);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user_id = userData.user.id;

  const { data, error } = await supabase
    .from('saved_plants')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return res.status(500).json({ error: 'Failed to fetch plants' });
  }

  res.json(data);
});

// статус серверу чи працює він
app.get("/", (_, res) => {
  res.send("✅ Plant backend live");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// Отримання даних про поточного користувача
app.get('/me', async (req, res) => {
  const access_token = req.headers.authorization?.split("Bearer ")[1];

  if (!access_token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }

  const { data: userData, error } = await supabase.auth.getUser(access_token);

  if (error || !userData?.user) {
    console.error("Auth check error:", error);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, id } = userData.user;

  res.json({ email, id });
});
