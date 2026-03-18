// Always prefer an explicit backend URL so we don't depend on Vercel rewrites.
// In local dev, default to the local backend; in production, default to Render.
const DEFAULT_LOCAL_BACKEND = "http://127.0.0.1:8000";
const DEFAULT_RENDER_BACKEND = "https://plant-disease-identifier-3bxa.onrender.com";

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? DEFAULT_LOCAL_BACKEND : DEFAULT_RENDER_BACKEND);

// Asset URL handling
export const ASSET_BASE_URL =
  import.meta.env.VITE_ASSET_BASE_URL ||
  (API_BASE_URL.startsWith("http") ? API_BASE_URL : DEFAULT_RENDER_BACKEND);

export function resolveImageUrl(image) {
  if (!image) return image;
  if (typeof image !== "string") return image;

  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  if (image.startsWith("/uploads/")) return `${ASSET_BASE_URL}${image}`;

  return image;
}

// Fetch plants
export const fetchPlants = async (token) => {
  try {
    const headers = token ? { Authorization: token } : {};

    const res = await fetch(`${API_BASE_URL}/plants`, { headers });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("Backend error:", errorText);
      throw new Error("Backend error");
    }

    const data = await res.json();

    return data.map((plant) => ({
      ...plant,
      image: resolveImageUrl(plant.image),
    }));
  } catch (error) {
    console.error("Fetch plants error:", error);
    throw error;
  }
};

// Delete plant
export const deletePlant = async (id, token) => {
  const res = await fetch(`${API_BASE_URL}/plants/${id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });

  if (!res.ok) throw new Error("Delete failed");

  return res.json();
};
