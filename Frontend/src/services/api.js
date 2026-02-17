// Always prefer an explicit backend URL so we don't depend on Vercel rewrites.
// On Vercel, set VITE_BACKEND_URL to your Render URL, e.g.:
// VITE_BACKEND_URL=https://plant-disease-identifier-3bxa.onrender.com
export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://plant-disease-identifier-3bxa.onrender.com";

// Assets (uploaded images) may live at the backend origin (`https://...onrender.com/uploads/...`)
// or may be proxied through Vercel at same-origin (`/uploads/...`) or served from Cloudinary (absolute).
export const ASSET_BASE_URL =
  import.meta.env.VITE_ASSET_BASE_URL ||
  (API_BASE_URL.startsWith("http") ? API_BASE_URL : "https://plant-disease-identifier-3bxa.onrender.com");

export function resolveImageUrl(image) {
  if (!image) return image;
  if (typeof image !== "string") return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/uploads/")) return `${ASSET_BASE_URL}${image}`;
  return image;
}

export const fetchPlants = async (token) => {
  try {
    const headers = token ? { Authorization: token } : {};
    const res = await fetch(`${API_BASE_URL}/plants`, { headers });

    // If backend stopped or returns non-JSON (like 502/504)
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("Backend error:", errorText);
      throw new Error("Backend error");
    }

    try {
      const data = await res.json();
      // Ensure image URLs resolve correctly in both `/api` proxy mode and direct-backend mode
      return data.map((plant) => ({
        ...plant,
        image: resolveImageUrl(plant.image),
      }));
    } catch (e) {
      console.error("JSON parse error:", e);
      throw new Error("Invalid response from server");
    }
  } catch (error) {
    console.error("Fetch plants error:", error);
    throw error;
  }
};
export const deletePlant = async (id, token) => {
  const res = await fetch(`${API_BASE_URL}/plants/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: token,
    },
  });

  if (!res.ok) throw new Error("Delete failed");

  return res.json();
};
