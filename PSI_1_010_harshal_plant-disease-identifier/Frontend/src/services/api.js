export const fetchPlants = async (token) => {
  try {
    const headers = token ? { Authorization: token } : {};
    const res = await fetch("/api/plants", { headers });

    // If backend stopped or returns non-JSON (like 502/504)
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("Backend error:", errorText);
      throw new Error("Backend error");
    }

    try {
      return await res.json();
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
  const res = await fetch(`/api/plants/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: token,
    },
  });

  if (!res.ok) throw new Error("Delete failed");

  return res.json();
};
