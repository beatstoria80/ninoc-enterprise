async function checkProducts() {
  try {
    const res = await fetch("http://localhost:3000/api/products");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data length:", Array.isArray(data) ? data.length : "Not an array");
    if (data.error) console.log("Error from server:", data.error);
  } catch (err) {
    console.error("Products fetch failed:", err);
  }
}
checkProducts();
