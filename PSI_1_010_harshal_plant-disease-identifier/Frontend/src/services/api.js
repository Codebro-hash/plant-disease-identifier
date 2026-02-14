export const fetchPlants = async (token) => {
  try {
    const headers = token ? { Authorization: token } : {};
    const res = await fetch("/api/plants", { headers });

    // If backend stopped → fetch fails
    if (!res.ok) {
      throw new Error("Backend error");
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch plants error:", error);
    throw error; // VERY IMPORTANT
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
