require("dotenv").config(); // Load environment variables
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const Busboy = require("busboy");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Validate Supabase credentials
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Service Key is missing in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing body data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.rawBody = "";
  req.on("data", (chunk) => {
    req.rawBody += chunk.toString();
  });
  next();
});

// Constants
const bucketName = "Songs of Music App"; // Replace with your actual bucket name

// Upload Song Endpoint
app.post("/uploadSong", async (req, res) => {
  try {
    const busboy = new Busboy({ headers: req.headers });
    const fields = {};
    let fileData;

    busboy.on("field", (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => {
        fileData = {
          buffer: Buffer.concat(chunks),
          filename,
          mimetype,
        };
      });
    });

    busboy.on("finish", async () => {
      if (!fileData || !fields.title) {
        return res.status(400).json({ error: "File and title are required" });
      }

      // Upload file to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(bucketName)
        .upload(`songs/${Date.now()}_${fileData.filename}`, fileData.buffer, {
          contentType: fileData.mimetype,
        });

      if (storageError) {
        console.error(storageError);
        throw new Error("Failed to upload file to storage");
      }

      // Get public URL
      const { publicUrl } = supabase.storage.from(bucketName).getPublicUrl(storageData.path);

      // Insert metadata into the database
      const { error: dbError } = await supabase.from("songs").insert({
        title: fields.title,
        file_url: publicUrl,
        likes: 0,
        created_at: new Date(),
      });

      if (dbError) {
        console.error(dbError);
        throw new Error("Failed to save metadata to database");
      }

      res.status(201).json({ message: "Song uploaded successfully" });
    });

    busboy.end(req.rawBody);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch All Songs Endpoint
app.get("/getSongs", async (req, res) => {
  try {
    const { data: songs, error } = await supabase
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch songs" });
    }

    res.status(200).json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
});

// Like Song Endpoint
app.patch("/likeSong/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Increment the `likes` column
    const { error } = await supabase
      .from("songs")
      .update({ likes: supabase.sql`likes + 1` }) // Adjust as necessary
      .eq("id", id);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to like song" });
    }

    res.status(200).json({ message: "Song liked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to like song" });
  }
});

// Delete Song Endpoint
app.delete("/deleteSong/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch song metadata
    const { data: song, error: fetchError } = await supabase
      .from("songs")
      .select("file_url")
      .eq("id", id)
      .single();

    if (fetchError || !song) {
      console.error(fetchError);
      return res.status(404).json({ error: "Song not found" });
    }

    // Extract the file path from the public URL
    const publicPath = "/storage/v1/object/public/";
    const filePath = song.file_url.includes(publicPath)
      ? song.file_url.split(publicPath)[1]
      : song.file_url;

    // Delete file from Supabase Storage
    const { error: storageError } = await supabase.storage.from(bucketName).remove([filePath]);

    if (storageError) {
      console.error(storageError);
      return res.status(500).json({ error: "Failed to delete file from storage" });
    }

    // Delete song metadata from the database
    const { error: dbError } = await supabase.from("songs").delete().eq("id", id);

    if (dbError) {
      console.error(dbError);
      return res.status(500).json({ error: "Failed to delete song from database" });
    }

    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete song" });
  }
});

// Export the Express app as a handler for Vercel
module.exports = app;
