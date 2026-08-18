document.addEventListener("DOMContentLoaded", function () {
  const mapElement = document.getElementById("map");

  if (!mapElement) {
    console.error("Map element not found!");
    return;
  }

  let locations;
  try {
    locations = JSON.parse(mapElement.dataset.locations);
  } catch (error) {
    console.error("Invalid locations data:", error);
    return;
  }

  if (!locations || locations.length === 0) {
    console.warn("No locations found");
    return;
  }

  const [lng, lat] = locations[0].coordinates;

  // 🚫 CREATE MAP WITHOUT ZOOM CONTROLS
  const map = L.map("map", {
    zoomControl: false, // ← Removes + and - buttons
    scrollWheelZoom: false, // ← Disables scroll zoom (optional)
    doubleClickZoom: true, // ← Disables double-click zoom (optional)
  }).setView([lat, lng], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    className: "bw-map",
  }).addTo(map);

  // Custom green marker
  const greenIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: #2ecc71;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      font-weight: bold;
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  // ✅ Add markers with PERMANENT tooltips (labels)
  locations.forEach(function (location) {
    const [lng, lat] = location.coordinates;

    const marker = L.marker([lat, lng], { icon: greenIcon })
      .addTo(map)
      .bindTooltip(
        `
        <strong> Day ${location.day}</strong><br>
        ${location.description || location.address || "Tour location"}
      `,
        {
          permanent: true, // ← Always visible
          direction: "top", // ← Above the marker
          offset: [0, -10], // ← Slight offset
          className: "custom-tooltip",
        },
      );
  });

  if (locations.length > 1) {
    const bounds = locations.map((loc) => [
      loc.coordinates[1],
      loc.coordinates[0],
    ]);
    map.fitBounds(bounds);
  }
});
