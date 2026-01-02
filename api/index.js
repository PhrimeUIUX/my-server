app.use(
  cors({
    origin: [
      "https://ppctoda.vercel.app",      // your frontend
      "http://localhost:3000"            // local dev (optional)
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// VERY IMPORTANT for Vercel
app.options("*", cors());
