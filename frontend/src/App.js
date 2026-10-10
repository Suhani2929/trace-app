import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";
const EMERGENCY = "112";

const emptyProfile = {
  name: "",
  email: "",
  password: "",
  age: "",
  gender: "",
  address: "",
  city: "",
  conditions: "",
  allergies: "",
  medications: "",
  bloodGroup: "",
  emergencyContact: ""
};

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function App() {
  const [profile, setProfile] =
    useState(emptyProfile);

  const [form, setForm] =
    useState(emptyProfile);

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [authMode, setAuthMode] =
    useState("signup");

  const [symptoms, setSymptoms] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [doctorOpen, setDoctorOpen] =
    useState(false);

  const [places, setPlaces] =
    useState([]);

  const [placeLoading, setPlaceLoading] =
    useState(false);

  const [radius, setRadius] =
    useState(5);

  const [locationMode, setLocationMode] =
    useState("gps");

  const [customLocation, setCustomLocation] =
    useState("");

  const [coords, setCoords] =
    useState(null);

  const [locationLabel, setLocationLabel] =
    useState("");

  const [locationError, setLocationError] =
    useState("");

  useEffect(() => {
    const saved =
      localStorage.getItem("TRACE_PROFILE");

    if (!saved) {
      return;
    }

    try {
      const savedProfile =
        JSON.parse(saved);

      const cleanProfile = {
        ...emptyProfile,
        ...savedProfile
      };

      setProfile(cleanProfile);
      setForm(cleanProfile);
      setLoggedIn(true);
    } catch (error) {
      console.error(
        "TRACE profile error:",
        error
      );

      localStorage.removeItem(
        "TRACE_PROFILE"
      );
    }
  }, []);

  function saveProfile(data) {
    const clean = {
      ...emptyProfile,
      ...data
    };

    setProfile(clean);
    setForm(clean);

    localStorage.setItem(
      "TRACE_PROFILE",
      JSON.stringify(clean)
    );
  }

  function logout() {
    setLoggedIn(false);
    setResult(null);
  }

  function createAccount() {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.age
    ) {
      alert(
        "Please enter name, email, password and age."
      );
      return;
    }

    saveProfile(form);
    setLoggedIn(true);
  }

  function login() {
    const saved =
      localStorage.getItem(
        "TRACE_PROFILE"
      );

    if (!saved) {
      alert(
        "No local TRACE account found. Please create a profile first."
      );
      return;
    }

    try {
      const savedProfile =
        JSON.parse(saved);

      if (
        savedProfile.email !== form.email ||
        savedProfile.password !== form.password
      ) {
        alert(
          "Email or password is incorrect."
        );
        return;
      }

      setProfile(savedProfile);
      setForm(savedProfile);
      setLoggedIn(true);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to load your TRACE profile."
      );
    }
  }

  async function analyzeSymptoms() {
    const symptomText =
      symptoms.trim();

    if (!symptomText) {
      alert(
        "Please describe your symptoms first."
      );
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log(
        "TRACE: Starting symptom analysis..."
      );

      const response =
        await fetch(
          `${API_URL}/api/analyze-symptoms`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              symptoms: symptomText,
              profile: profile
            })
          }
        );

      console.log(
        "TRACE: Backend status:",
        response.status
      );

      const data =
        await response.json();

      console.log(
        "TRACE: Backend result:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Backend analysis failed."
        );
      }

      setResult(data);
    } catch (error) {
      console.error(
        "TRACE ANALYSIS ERROR:",
        error
      );

      alert(
        `TRACE could not analyze the symptoms.\n\n${error.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  function getGPS() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationLabel("");

      setLocationError(
        "GPS is not supported by this browser. Please use Profile address or Other location."
      );

      return;
    }

    setLocationLabel(
      "Detecting your location..."
    );

    navigator.geolocation.getCurrentPosition(
      position => {
        const location = {
          lat:
            position.coords.latitude,

          lon:
            position.coords.longitude
        };

        console.log(
          "TRACE GPS LOCATION:",
          location
        );

        setCoords(location);
        setLocationMode("gps");

        setLocationLabel(
          "Your current location"
        );

        setLocationError("");
      },

      error => {
        console.error(
          "TRACE GPS ERROR:",
          error.code,
          error.message
        );

        let message =
          "Could not detect your current location.";

        if (error.code === 1) {
          message =
            "Location permission was denied. Click the 🔒 icon beside localhost:3000 → Location → Allow, then refresh the page.";
        }

        if (error.code === 2) {
          message =
            "Your device could not determine a GPS location. Try Profile address or Other location.";
        }

        if (error.code === 3) {
          message =
            "Location detection timed out. Try again or use Profile address.";
        }

        setLocationLabel("");
        setLocationError(message);
      },

      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  }

  async function geocodeLocation(
    query
  ) {
    const response =
      await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(
          query
        )}`
      );

    if (!response.ok) {
      throw new Error(
        "Location service unavailable."
      );
    }

    const data =
      await response.json();

    if (!data.length) {
      throw new Error(
        "Location not found."
      );
    }

    return {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
      label:
        data[0].display_name
    };
  }

  async function findHealthcare() {
    setPlaceLoading(true);
    setLocationError("");

    try {
      let origin = null;

      if (locationMode === "gps") {
        if (!coords) {
          origin =
            await new Promise(
              (resolve, reject) => {
                if (
                  !navigator.geolocation
                ) {
                  reject(
                    new Error(
                      "Location is unavailable."
                    )
                  );

                  return;
                }

                navigator.geolocation.getCurrentPosition(
                  position => {
                    const location = {
                      lat:
                        position.coords
                          .latitude,

                      lon:
                        position.coords
                          .longitude
                    };

                    setCoords(location);

                    setLocationLabel(
                      "Your current location"
                    );

                    resolve(location);
                  },

                  error => {
                    console.error(
                      "TRACE GPS SEARCH ERROR:",
                      error
                    );

                    if (
                      error.code === 1
                    ) {
                      reject(
                        new Error(
                          "Please allow location access in Chrome."
                        )
                      );
                    } else if (
                      error.code === 2
                    ) {
                      reject(
                        new Error(
                          "Your device could not determine your location. Use Profile address or Other location."
                        )
                      );
                    } else {
                      reject(
                        new Error(
                          "Location detection timed out. Use Profile address or Other location."
                        )
                      );
                    }
                  },

                  {
                    enableHighAccuracy: false,
                    timeout: 15000,
                    maximumAge: 300000
                  }
                );
              }
            );
        } else {
          origin = coords;
        }
      }

      if (locationMode === "profile") {
        const query = [
          profile.address,
          profile.city,
          "India"
        ]
          .filter(Boolean)
          .join(", ");

        if (!query) {
          throw new Error(
            "Add your address and city in your profile first."
          );
        }

        origin =
          await geocodeLocation(
            query
          );

        setCoords(origin);

        setLocationLabel(
          "Saved profile location"
        );
      }

      if (locationMode === "custom") {
        if (!customLocation.trim()) {
          throw new Error(
            "Enter a location first."
          );
        }

        origin =
          await geocodeLocation(
            customLocation
          );

        setCoords(origin);

        setLocationLabel(
          origin.label
        );
      }

      if (!origin) {
        throw new Error(
          "Please select a location."
        );
      }

      const overpassQuery = `
[out:json][timeout:30];
(
  nwr["amenity"="hospital"]
    (around:15000,${origin.lat},${origin.lon});

  nwr["amenity"="clinic"]
    (around:15000,${origin.lat},${origin.lon});

  nwr["healthcare"="hospital"]
    (around:15000,${origin.lat},${origin.lon});

  nwr["healthcare"="clinic"]
    (around:15000,${origin.lat},${origin.lon});
);
out center tags;
`;

      const response =
        await fetch(
          "https://overpass-api.de/api/interpreter",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain"
            },

            body: overpassQuery
          }
        );

      if (!response.ok) {
        throw new Error(
          "Healthcare location service unavailable."
        );
      }

      const data =
        await response.json();

      const formatted =
        (data.elements || [])
          .map(place => {
            const lat =
              place.lat ??
              place.center?.lat;

            const lon =
              place.lon ??
              place.center?.lon;

            if (
              lat == null ||
              lon == null
            ) {
              return null;
            }

            const tags =
              place.tags || {};

            const distance =
              distanceKm(
                origin.lat,
                origin.lon,
                Number(lat),
                Number(lon)
              );

            return {
              id: `${place.type}-${place.id}`,

              name:
                tags.name ||
                "Healthcare facility",

              type:
                tags.amenity ===
                  "clinic" ||
                tags.healthcare ===
                  "clinic"
                  ? "Clinic"
                  : "Hospital",

              distance,

              lat: Number(lat),
              lon: Number(lon),

              address:
                tags["addr:full"] ||
                tags["addr:street"] ||
                tags["addr:city"] ||
                "Address not listed",

              phone:
                tags.phone ||
                tags["contact:phone"] ||
                "",

              emergency:
                tags.emergency === "yes"
            };
          })
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.distance -
              b.distance
          );

      setPlaces(formatted);
    } catch (error) {
      console.error(
        "TRACE healthcare error:",
        error
      );

      setPlaces([]);

      setLocationError(
        error.message ||
          "Could not find nearby healthcare facilities."
      );
    } finally {
      setPlaceLoading(false);
    }
  }

  const nearbyPlaces =
    useMemo(() => {
      return places.filter(
        place =>
          place.distance <= radius
      );
    }, [places, radius]);

  if (!loggedIn) {
    return (
      <div className="trace-auth">
        <div className="auth-card">

          <div className="trace-logo">
            ✚
          </div>

          <h1>TRACE</h1>

          <p className="auth-subtitle">
            Transparent Health Reasoning
          </p>

          <div className="auth-tabs">

            <button
              type="button"
              className={
                authMode === "login"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAuthMode("login")
              }
            >
              Login
            </button>

            <button
              type="button"
              className={
                authMode === "signup"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setAuthMode("signup")
              }
            >
              Create Profile
            </button>

          </div>

          {authMode === "signup" ? (
            <>
              <input
                placeholder="Full name"
                value={form.name}
                onChange={e =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={e =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e =>
                  setForm({
                    ...form,
                    password:
                      e.target.value
                  })
                }
              />

              <input
                type="number"
                placeholder="Age"
                value={form.age}
                onChange={e =>
                  setForm({
                    ...form,
                    age: e.target.value
                  })
                }
              />

              <input
                placeholder="Gender (optional)"
                value={form.gender}
                onChange={e =>
                  setForm({
                    ...form,
                    gender: e.target.value
                  })
                }
              />

              <input
                placeholder="Home address"
                value={form.address}
                onChange={e =>
                  setForm({
                    ...form,
                    address:
                      e.target.value
                  })
                }
              />

              <input
                placeholder="City"
                value={form.city}
                onChange={e =>
                  setForm({
                    ...form,
                    city: e.target.value
                  })
                }
              />

              <button
                type="button"
                className="primary-button"
                onClick={createAccount}
              >
                Create my TRACE profile
              </button>
            </>
          ) : (
            <>
              <input
                placeholder="Email"
                value={form.email}
                onChange={e =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e =>
                  setForm({
                    ...form,
                    password:
                      e.target.value
                  })
                }
              />

              <button
                type="button"
                className="primary-button"
                onClick={login}
              >
                Login to TRACE
              </button>
            </>
          )}

          <small>
            Prototype authentication stores
            data locally in this browser.
          </small>

        </div>
      </div>
    );
  }

  return (
    <div className="trace-app">

      <header className="topbar">

        <div className="brand">

          <span>✚</span>

          <div>
            <strong>TRACE</strong>

            <small>
              HEALTH REASONING ENGINE
            </small>
          </div>

        </div>

        <div className="top-actions">

          <button
            type="button"
            className="profile-button"
            onClick={() => {
              setForm(profile);
              setProfileOpen(true);
            }}
          >
            👤 {profile.name || "Profile"}
          </button>

          <button
            type="button"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>

      <main className="dashboard">

        <section className="hero-card">

          <div>

            <span className="eyebrow">
              PERSONALIZED HEALTH CONTEXT
            </span>

            <h1>
              Good day,{" "}
              {profile.name ||
                "there"}.
            </h1>

            <p>
              Understand your symptoms and see
              how TRACE reasons from the
              information you provide.
            </p>

          </div>

          <div className="hero-icon">
            ✦
          </div>

        </section>

        <section className="profile-summary">

          <div>
            <strong>
              YOUR HEALTH CONTEXT
            </strong>

            <p>
              Age:{" "}
              {profile.age ||
                "Not provided"}{" "}
              ·{" "}
              {profile.city ||
                "Location not provided"}
            </p>
          </div>

          <div>

            <span>
              {profile.conditions
                ? "✓ Health history"
                : "○ Health history"}
            </span>

            <span>
              {profile.allergies
                ? "✓ Allergies"
                : "○ Allergies"}
            </span>

            <span>
              {profile.medications
                ? "✓ Medications"
                : "○ Medications"}
            </span>

          </div>

          <button
            type="button"
            onClick={() => {
              setForm(profile);
              setProfileOpen(true);
            }}
          >
            Edit profile
          </button>

        </section>

        <section className="analysis-card">

          <div className="section-number">
            01
          </div>

          <div className="section-content">

            <span className="eyebrow">
              DESCRIBE YOUR SYMPTOMS
            </span>

            <h2>
              What are you experiencing?
            </h2>

            <textarea
              value={symptoms}
              onChange={e =>
                setSymptoms(
                  e.target.value
                )
              }
              placeholder="Example: I have a sharp headache on the right side since this morning. It gets worse when I move."
            />

            <div className="analysis-actions">

              <button
                type="button"
                className="primary-button"
                onClick={
                  analyzeSymptoms
                }
                disabled={loading}
              >
                {loading
                  ? "Analyzing..."
                  : "Analyze with TRACE →"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setDoctorOpen(true)
                }
              >
                🩺 Doctor Summary
              </button>

            </div>

          </div>

        </section>
                {result && (
          <section className="results">

            {result.emergency && (
              <div className="emergency-box">

                <strong>
                  ⚠ Potential urgent warning
                </strong>

                <p>
                  Seek urgent professional
                  assessment. If symptoms are
                  severe or rapidly worsening,
                  call {EMERGENCY}.
                </p>

              </div>
            )}

            {/* ─────────────────────────────
                NATURAL TRACE ASSESSMENT
            ───────────────────────────── */}

            <div className="full-result">

              <span className="eyebrow">
                TRACE ASSESSMENT
              </span>

              <h2>
                🩺 What your symptoms may mean
              </h2>

              <p>
                {result.overview}
              </p>

              <div className="result-grid">

                <ResultCard
                  title="What may be happening"
                  items={
                    result.whatMayBeHappening
                  }
                />

                <ResultCard
                  title="Why it may be happening"
                  items={
                    result.whyItMayBeHappening
                  }
                />

              </div>

              <div className="result-grid">

                <ResultCard
                  title={
                    result.summary?.severity ===
                    "mild"
                      ? "🟢 What you can do now"
                      : "What to do now"
                  }
                  items={
                    result.whatToDoNow
                  }
                />

                <ResultCard
                  title="⚠ When to seek care"
                  items={
                    result.whenToSeekCare
                  }
                />

              </div>

            </div>


            {/* ─────────────────────────────
                TRACE REASONING RECEIPT
            ───────────────────────────── */}

            <div className="receipt-header">

              <span>
                TRACE REASONING RECEIPT
              </span>

              <h2>
                {result.summary
                  ?.primaryPattern ||
                  "Health concern"}
              </h2>

            </div>


            <div className="result-grid">

              <ResultCard
                title="Evidence detected"
                items={
                  result.evidence
                }
              />

              <ResultCard
                title="What TRACE does not know"
                items={
                  result.missingInformation
                }
              />

            </div>


            <div className="full-result">

              <h2>
                Possible explanations
              </h2>

              <div className="explanation-grid">

                {(
                  result.possibleExplanations ||
                  []
                ).map(
                  (item, index) => (

                    <div
                      className="explanation-card"
                      key={index}
                    >

                      <h3>
                        {item.explanation ||
                          item.label ||
                          item.title}
                      </h3>

                      <p>
                        <strong>
                          Supports:
                        </strong>{" "}
                        {item.supports}
                      </p>

                      <p>
                        <strong>
                          Still missing:
                        </strong>{" "}
                        {item.missing}
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>


            <div className="result-grid">

              <ResultCard
                title="Questions that could change the decision"
                items={
                  result.decisionChangingQuestions
                }
                numbered
              />

              <ResultCard
                title="What to do now"
                items={
                  result.whatToDoNow
                }
              />

            </div>


            <div className="disclaimer">
              {result.disclaimer}
            </div>

          </section>
        )}


        {/* ─────────────────────────────────
            CARE LOCATOR
        ───────────────────────────────── */}

        <section className="care-card">

          <div className="care-heading">

            <div>

              <span className="eyebrow">
                CARE LOCATOR
              </span>

              <h2>
                Find hospitals & clinics
                near you
              </h2>

              <p>
                Search within 1 km, 2 km, 5 km
                or 15 km using your current
                location, saved address, or
                another location.
              </p>

            </div>

            <div className="location-symbol">
              📍
            </div>

          </div>


          <div className="location-options">

            <button
              type="button"
              className={
                locationMode === "gps"
                  ? "selected"
                  : ""
              }
              onClick={getGPS}
            >
              📡 Current GPS
            </button>


            <button
              type="button"
              className={
                locationMode === "profile"
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setLocationMode("profile")
              }
            >
              🏠 Profile address
            </button>


            <button
              type="button"
              className={
                locationMode === "custom"
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setLocationMode("custom")
              }
            >
              🔎 Other location
            </button>

          </div>


          {locationMode === "custom" && (
            <input
              className="location-input"
              placeholder="Enter area, landmark, address or city"
              value={customLocation}
              onChange={e =>
                setCustomLocation(
                  e.target.value
                )
              }
            />
          )}


          <div className="radius-row">

            {[1, 2, 5, 15].map(
              value => (

                <button
                  type="button"
                  key={value}
                  className={
                    radius === value
                      ? "radius-selected"
                      : ""
                  }
                  onClick={() =>
                    setRadius(value)
                  }
                >
                  {value} km
                </button>

              )
            )}


            <button
              type="button"
              className="find-button"
              onClick={
                findHealthcare
              }
              disabled={
                placeLoading
              }
            >
              {placeLoading
                ? "Finding..."
                : "Find nearby care →"}
            </button>

          </div>


          {locationLabel && (
            <div className="location-label">

              📍 Searching around{" "}

              <strong>
                {locationLabel}
              </strong>

            </div>
          )}


          {locationError && (
            <div className="location-error">
              {locationError}
            </div>
          )}


          {places.length > 0 &&
            !placeLoading && (
              <div className="places">

                <h3>
                  {nearbyPlaces.length} facilities
                  within {radius} km
                </h3>


                <div className="places-grid">

                  {nearbyPlaces.map(
                    place => (

                      <div
                        className="place-card"
                        key={place.id}
                      >

                        <div className="place-top">

                          <div className="place-icon">
                            {place.type ===
                            "Clinic"
                              ? "⚕"
                              : "🏥"}
                          </div>

                          <span>
                            {place.type}
                          </span>

                        </div>


                        <h3>
                          {place.name}
                        </h3>


                        <p>
                          📍 {place.address}
                        </p>


                        <strong>
                          {place.distance.toFixed(
                            1
                          )}{" "}
                          km away
                        </strong>


                        {place.emergency && (
                          <div className="emergency-tag">
                            Emergency listed
                          </div>
                        )}


                        <div className="place-actions">

                          {place.phone && (
                            <a
                              href={`tel:${place.phone}`}
                            >
                              📞 Call
                            </a>
                          )}


                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            🗺 Directions
                          </a>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>
            )}

        </section>
                <section className="care-card">

          <div className="care-heading">

            <div>
              <span className="eyebrow">
                CARE LOCATOR
              </span>

              <h2>
                Find hospitals & clinics
                near you
              </h2>

              <p>
                Search within 1 km, 2 km, 5 km
                or 15 km using your current
                location, saved address, or
                another location.
              </p>
            </div>

            <div className="location-symbol">
              📍
            </div>

          </div>

          <div className="location-options">

            <button
              type="button"
              className={
                locationMode === "gps"
                  ? "selected"
                  : ""
              }
              onClick={getGPS}
            >
              📡 Current GPS
            </button>

            <button
              type="button"
              className={
                locationMode === "profile"
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setLocationMode("profile")
              }
            >
              🏠 Profile address
            </button>

            <button
              type="button"
              className={
                locationMode === "custom"
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setLocationMode("custom")
              }
            >
              🔎 Other location
            </button>

          </div>

          {locationMode === "custom" && (
            <input
              className="location-input"
              placeholder="Enter area, landmark, address or city"
              value={customLocation}
              onChange={e =>
                setCustomLocation(
                  e.target.value
                )
              }
            />
          )}

          <div className="radius-row">

            {[1, 2, 5, 15].map(
              value => (
                <button
                  type="button"
                  key={value}
                  className={
                    radius === value
                      ? "radius-selected"
                      : ""
                  }
                  onClick={() =>
                    setRadius(value)
                  }
                >
                  {value} km
                </button>
              )
            )}

            <button
              type="button"
              className="find-button"
              onClick={findHealthcare}
              disabled={placeLoading}
            >
              {placeLoading
                ? "Finding..."
                : "Find nearby care →"}
            </button>

          </div>

          {locationLabel && (
            <div className="location-label">
              📍 Searching around{" "}
              <strong>
                {locationLabel}
              </strong>
            </div>
          )}

          {locationError && (
            <div className="location-error">
              {locationError}
            </div>
          )}

          {places.length > 0 &&
            !placeLoading && (
              <div className="places">

                <h3>
                  {nearbyPlaces.length} facilities
                  within {radius} km
                </h3>

                <div className="places-grid">

                  {nearbyPlaces.map(
                    place => (

                      <div
                        className="place-card"
                        key={place.id}
                      >

                        <div className="place-top">

                          <div className="place-icon">
                            {place.type ===
                            "Clinic"
                              ? "⚕"
                              : "🏥"}
                          </div>

                          <span>
                            {place.type}
                          </span>

                        </div>

                        <h3>
                          {place.name}
                        </h3>

                        <p>
                          📍 {place.address}
                        </p>

                        <strong>
                          {place.distance.toFixed(
                            1
                          )}{" "}
                          km away
                        </strong>

                        {place.emergency && (
                          <div className="emergency-tag">
                            Emergency listed
                          </div>
                        )}

                        <div className="place-actions">

                          {place.phone && (
                            <a
                              href={`tel:${place.phone}`}
                            >
                              📞 Call
                            </a>
                          )}

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            🗺 Directions
                          </a>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>
            )}

        </section>

      </main>


      {/* ─────────────────────────────
          PROFILE MODAL
      ───────────────────────────── */}

      {profileOpen && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setProfileOpen(false)
          }
        >

          <div
            className="modal-card profile-modal"
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span className="eyebrow">
                  YOUR PROFILE
                </span>

                <h2>
                  Health context
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setProfileOpen(false)
                }
              >
                ×
              </button>

            </div>


            <div className="profile-grid">

              <label>
                Full name

                <input
                  value={form.name}
                  onChange={e =>
                    setForm({
                      ...form,
                      name: e.target.value
                    })
                  }
                />
              </label>


              <label>
                Email

                <input
                  value={form.email}
                  onChange={e =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                />
              </label>


              <label>
                Age

                <input
                  type="number"
                  value={form.age}
                  onChange={e =>
                    setForm({
                      ...form,
                      age: e.target.value
                    })
                  }
                />
              </label>


              <label>
                Gender

                <input
                  value={form.gender}
                  onChange={e =>
                    setForm({
                      ...form,
                      gender: e.target.value
                    })
                  }
                />
              </label>


              <label className="wide">
                Address

                <input
                  value={form.address}
                  onChange={e =>
                    setForm({
                      ...form,
                      address:
                        e.target.value
                    })
                  }
                  placeholder="House / street / area"
                />
              </label>


              <label>
                City

                <input
                  value={form.city}
                  onChange={e =>
                    setForm({
                      ...form,
                      city: e.target.value
                    })
                  }
                />
              </label>


              <label>
                Blood group

                <input
                  value={form.bloodGroup}
                  onChange={e =>
                    setForm({
                      ...form,
                      bloodGroup:
                        e.target.value
                    })
                  }
                  placeholder="Optional"
                />
              </label>


              <label className="wide">
                Health history

                <textarea
                  value={form.conditions}
                  onChange={e =>
                    setForm({
                      ...form,
                      conditions:
                        e.target.value
                    })
                  }
                  placeholder="Existing conditions, previous surgeries, important history..."
                />
              </label>


              <label className="wide">
                Allergies

                <textarea
                  value={form.allergies}
                  onChange={e =>
                    setForm({
                      ...form,
                      allergies:
                        e.target.value
                    })
                  }
                  placeholder="Medicines, foods or other allergies"
                />
              </label>


              <label className="wide">
                Current medications

                <textarea
                  value={form.medications}
                  onChange={e =>
                    setForm({
                      ...form,
                      medications:
                        e.target.value
                    })
                  }
                  placeholder="Medicines you currently take"
                />
              </label>


              <label className="wide">
                Emergency contact

                <input
                  value={
                    form.emergencyContact
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      emergencyContact:
                        e.target.value
                    })
                  }
                  placeholder="Phone number"
                />
              </label>

            </div>


            <div className="modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setProfileOpen(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  saveProfile(form);
                  setProfileOpen(false);
                }}
              >
                Save health context
              </button>

            </div>

          </div>

        </div>
      )}


      {/* ─────────────────────────────
          DOCTOR SUMMARY MODAL
      ───────────────────────────── */}

      {doctorOpen && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setDoctorOpen(false)
          }
        >

          <div
            className="modal-card doctor-modal"
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="eyebrow">
                  DOCTOR-READY SUMMARY
                </span>

                <h2>
                  Your TRACE summary
                </h2>

              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setDoctorOpen(false)
                }
              >
                ×
              </button>

            </div>


            {!result ? (

              <div className="empty-summary">

                <div>🩺</div>

                <h3>
                  Analyze your symptoms first
                </h3>

                <p>
                  Once TRACE has processed
                  your description, this space
                  will show a concise summary
                  you can use when speaking with
                  a healthcare professional.
                </p>

              </div>

            ) : (

              <>

                <div className="doctor-patient">

                  <div>
                    <span>Patient</span>

                    <strong>
                      {profile.name ||
                        "Not provided"}
                    </strong>
                  </div>

                  <div>
                    <span>Age</span>

                    <strong>
                      {profile.age ||
                        "Not provided"}
                    </strong>
                  </div>

                  <div>
                    <span>City</span>

                    <strong>
                      {profile.city ||
                        "Not provided"}
                    </strong>
                  </div>

                </div>


                <div className="doctor-section">

                  <h3>
                    Reported symptoms
                  </h3>

                  <p>
                    {symptoms}
                  </p>

                </div>


                <div className="doctor-section">

                  <h3>
                    TRACE assessment
                  </h3>

                  <p>
                    {result.summary
                      ?.primaryPattern ||
                      "Assessment available"}
                  </p>

                  {result.summary
                    ?.severity && (

                    <p>
                      Reported severity:{" "}

                      <strong>
                        {
                          result.summary
                            .severity
                        }
                      </strong>
                    </p>

                  )}

                </div>


                <div className="doctor-section">

                  <h3>
                    Relevant health context
                  </h3>

                  <ul>

                    <li>
                      Age:{" "}
                      {profile.age ||
                        "Not provided"}
                    </li>

                    <li>
                      Gender:{" "}
                      {profile.gender ||
                        "Not provided"}
                    </li>

                    <li>
                      Medical history:{" "}
                      {profile.conditions ||
                        "None provided"}
                    </li>

                    <li>
                      Allergies:{" "}
                      {profile.allergies ||
                        "None provided"}
                    </li>

                    <li>
                      Medications:{" "}
                      {profile.medications ||
                        "None provided"}
                    </li>

                    <li>
                      Blood group:{" "}
                      {profile.bloodGroup ||
                        "Not provided"}
                    </li>

                  </ul>

                </div>


                <div className="doctor-section">

                  <h3>
                    Questions for clinician
                  </h3>

                  <ul>

                    {(
                      result.decisionChangingQuestions ||
                      []
                    ).map(
                      (question, index) => (

                        <li key={index}>
                          {question}
                        </li>

                      )
                    )}

                  </ul>

                </div>


                <div className="doctor-note">

                  TRACE is a reasoning and
                  information-support tool. This
                  summary is not a medical
                  diagnosis and should be reviewed
                  by a qualified healthcare
                  professional.

                </div>

              </>

            )}

          </div>

        </div>
      )}

    </div>
  );
}


/* ─────────────────────────────────
   RESULT CARD COMPONENT
───────────────────────────────── */

function ResultCard({
  title,
  items,
  numbered = false
}) {
  const list = Array.isArray(items)
    ? items
    : items
      ? [items]
      : [];

  return (
    <div className="result-card">

      <h3>
        {title}
      </h3>

      {list.length === 0 ? (

        <p className="muted">
          No additional information
          available.
        </p>

      ) : (

        <ul>

          {list.map(
            (item, index) => (

              <li key={index}>

                {numbered && (
                  <span className="question-number">
                    {index + 1}
                  </span>
                )}

                <span>

                  {typeof item === "string"
                    ? item
                    : item?.question ||
                      item?.text ||
                      item?.item ||
                      JSON.stringify(item)}

                </span>

              </li>

            )
          )}

        </ul>

      )}

    </div>
  );
}

export default App;