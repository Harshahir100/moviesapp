proxy: {
  "/api": {
    target: "http://localhost:5004",  // 5001 — server.js ke saath match karo
    changeOrigin: true,
  }
}