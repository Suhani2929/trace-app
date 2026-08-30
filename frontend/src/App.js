import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  AppBar,
  Toolbar,
  Fade,
  Slide,
  TextField,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';

import {
  CloudUpload,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Schedule,
  Help,
  FileUpload,
  Description,
  Share,
  MedicalServices,
  Security,
  DeleteSweep,
  Healing,
  LocalHospital,
  Phone,
  LocationOn,
  Emergency,
  Favorite,
  Science,
  Person,
  Lock,
  Email,
  Home,
  Close,
  Star,
  Edit,
  Save,
  AccountCircle
} from '@mui/icons-material';

import { motion } from 'framer-motion';


// ============================================================
// THEME
// ============================================================

const theme = createTheme({
  palette: {
    primary: {
      main: '#7C3AED',
      light: '#A78BFA',
      dark: '#5B21B6'
    },
    secondary: {
      main: '#EC4899'
    },
    success: {
      main: '#10B981'
    },
    warning: {
      main: '#F59E0B'
    },
    error: {
      main: '#EF4444'
    },
    background: {
      default: '#F3F4F6',
      paper: '#FFFFFF'
    }
  },

  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif'
  },

  shape: {
    borderRadius: 16
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600
        }
      }
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    }
  }
});


// ============================================================
// CONSTANTS
// ============================================================

const EMERGENCY_NUMBER = '112';


// ============================================================
// FILE CONVERSION
// ============================================================

const toBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
};


// ============================================================
// DISTANCE
// ============================================================

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};


// ============================================================
// LOCAL SYMPTOM TRIAGE
// ============================================================

const classifySymptomsLocally = (input) => {
  const s = input
    .toLowerCase()
    .replace(/[.,!?]/g, ' ');

  const severePatterns = [
    'chest pain',
    'heart pain',
    'pain in my heart',
    'chest pressure',
    'pressure in chest',
    'chest tightness',
    'chest squeezing',
    'chest discomfort',
    'crushing chest pain',

    'pain spreading to arm',
    'pain spreading to jaw',
    'pain spreading to back',
    'pain in arm with chest pain',
    'jaw pain with chest pain',

    'cannot breathe',
    "can't breathe",
    'difficulty breathing',
    'difficulty in breathing',
    'severe shortness of breath',
    'trouble breathing',
    'unable to breathe',

    'face drooping',
    'one sided weakness',
    'one side weakness',
    'weakness on one side',
    'slurred speech',
    'cannot speak',
    'unable to speak',
    'difficulty speaking',

    'loss of consciousness',
    'unconscious',
    'not responding',
    'seizure',
    'convulsions',

    'severe bleeding',
    'vomiting blood',
    'coughing blood',

    'anaphylaxis',
    'severe allergic reaction',
    'swelling throat',
    'throat closing',

    'blue lips',
    'turning blue'
  ];

  const moderatePatterns = [
    'shortness of breath',
    'breathlessness',
    'high fever',
    'persistent fever',
    'persistent vomiting',
    'repeated vomiting',
    'persistent diarrhea',
    'dehydration',
    'severe headache',
    'repeated dizziness',
    'persistent abdominal pain',
    'worsening pain',
    'moderate pain',
    'fainting',
    'palpitations',
    'rapid heartbeat',
    'irregular heartbeat'
  ];

  if (
    severePatterns.some(
      pattern => s.includes(pattern)
    )
  ) {
    return {
      severity: 'severe',
      emergency: true
    };
  }

  if (
    moderatePatterns.some(
      pattern => s.includes(pattern)
    )
  ) {
    return {
      severity: 'moderate',
      emergency: false
    };
  }

  return {
    severity: 'mild',
    emergency: false
  };
};


// ============================================================
// APP
// ============================================================

function App() {

  // ==========================================================
  // AUTH / PROFILE
  // ==========================================================

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showLogin, setShowLogin] = useState(true);

  const [profileOpen, setProfileOpen] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);

  const [user, setUser] = useState({
    name: '',
    email: '',
    address: '',
    city: ''
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    address: '',
    city: ''
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupCity, setSignupCity] = useState('');


  // ==========================================================
  // RECORDS
  // ==========================================================

  const [documents, setDocuments] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [uploaded, setUploaded] = useState(false);


  // ==========================================================
  // SYMPTOMS
  // ==========================================================

  const [symptoms, setSymptoms] = useState('');
  const [symptomResult, setSymptomResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);


  // ==========================================================
  // UI
  // ==========================================================

  const [tabValue, setTabValue] = useState(0);
  const [showHospitals, setShowHospitals] = useState(false);


  // ==========================================================
  // HOSPITALS
  // ==========================================================

  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);


// ============================================================
// LOAD SAVED USER + RECORDS
// ============================================================

  useEffect(() => {

    const savedUser =
      localStorage.getItem('trace_user');

    const savedDocs =
      localStorage.getItem('trace_documents');

    const savedResults =
      localStorage.getItem('trace_results');


    if (savedUser) {
      try {
        const parsed =
          JSON.parse(savedUser);

        setUser(parsed);

        setProfileForm(parsed);

        setIsLoggedIn(true);

      } catch (_) {}
    }


    if (savedDocs) {
      try {
        const parsed =
          JSON.parse(savedDocs);

        setDocuments(parsed);

        if (parsed.length > 0) {
          setUploaded(true);
        }

      } catch (_) {}
    }


    if (savedResults) {
      try {
        setResults(
          JSON.parse(savedResults)
        );
      } catch (_) {}
    }

  }, []);


// ============================================================
// SAVE USER
// ============================================================

  useEffect(() => {

    if (isLoggedIn) {

      localStorage.setItem(
        'trace_user',
        JSON.stringify(user)
      );

    }

  }, [user, isLoggedIn]);


// ============================================================
// SAVE DOCUMENTS
// ============================================================

  useEffect(() => {

    localStorage.setItem(
      'trace_documents',
      JSON.stringify(documents)
    );

  }, [documents]);


// ============================================================
// SAVE RESULTS
// ============================================================

  useEffect(() => {

    if (results) {

      localStorage.setItem(
        'trace_results',
        JSON.stringify(results)
      );

    }

  }, [results]);


// ============================================================
// LOGIN
// ============================================================

  const handleLogin = () => {

    if (
      !loginEmail ||
      !loginPassword
    ) {

      alert(
        'Please enter email and password'
      );

      return;
    }


    const savedUser =
      localStorage.getItem('trace_user');


    if (savedUser) {

      try {

        const parsed =
          JSON.parse(savedUser);

        setUser({
          ...parsed,
          email: loginEmail
        });

        setProfileForm({
          ...parsed,
          email: loginEmail
        });

      } catch (_) {

        setUser({
          name: '',
          email: loginEmail,
          address: '',
          city: ''
        });

      }

    } else {

      setUser({
        name: '',
        email: loginEmail,
        address: '',
        city: ''
      });

    }

    setIsLoggedIn(true);
  };


// ============================================================
// SIGN UP
// ============================================================

  const handleSignup = () => {

    if (
      !signupName ||
      !signupEmail ||
      !signupPassword ||
      !signupAddress ||
      !signupCity
    ) {

      alert(
        'Please fill all fields'
      );

      return;
    }


    const newUser = {

      name: signupName,

      email: signupEmail,

      address: signupAddress,

      city: signupCity

    };


    setUser(newUser);

    setProfileForm(newUser);

    setIsLoggedIn(true);

  };


// ============================================================
// PROFILE
// ============================================================

  const openProfile = () => {

    setProfileForm({
      ...user
    });

    setEditingProfile(false);

    setProfileOpen(true);
  };


  const saveProfile = () => {

    if (
      !profileForm.name ||
      !profileForm.email ||
      !profileForm.address ||
      !profileForm.city
    ) {

      alert(
        'Please fill all profile fields.'
      );

      return;
    }


    setUser({
      ...profileForm
    });


    localStorage.setItem(
      'trace_user',
      JSON.stringify(profileForm)
    );


    setEditingProfile(false);

    alert(
      'Profile updated successfully.'
    );

  };


// ============================================================
// LOGOUT
// ============================================================

  const handleLogout = () => {

    /*
      IMPORTANT:
      We do NOT clear localStorage here.
      Your profile + records remain saved.
    */

    setIsLoggedIn(false);

    setProfileOpen(false);

    setNearbyHospitals([]);

  };


// ============================================================
// UPLOAD RECORDS
// ============================================================

  const handleUpload = async (e) => {

    const files =
      Array.from(
        e.target.files || []
      );

    if (!files.length) {
      return;
    }


    const metadata =
      files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));


    setDocuments(prev => [
      ...prev,
      ...metadata
    ]);

    setUploaded(true);

    setProcessing(true);


    try {

      const docContents =
        await Promise.all(

          files.map(
            async file => {

              if (
                file.type ===
                  'text/plain' ||
                file.name
                  .toLowerCase()
                  .endsWith('.txt')
              ) {

                return new Promise(
                  (resolve, reject) => {

                    const reader =
                      new FileReader();

                    reader.onload =
                      () => {

                        resolve({

                          name:
                            file.name,

                          content:
                            reader.result,

                          type:
                            file.type ||
                            'text/plain'

                        });

                      };

                    reader.onerror =
                      reject;

                    reader.readAsText(
                      file
                    );
                  }
                );

              }


              return {

                name:
                  file.name,

                content:
                  await toBase64(
                    file
                  ),

                type:
                  file.type

              };

            }
          )

        );


      const response =
        await axios.post(

          'http://localhost:5000/api/process',

          {
            documents:
              docContents
          }

        );


      setResults(
        response.data
      );


    } catch (error) {

      console.error(
        'Processing failed:',
        error
      );


      alert(
        'Document processing failed. Make sure the backend is running on port 5000.'
      );

    } finally {

      setProcessing(false);

    }

  };


// ============================================================
// SYMPTOM CHECK
// ============================================================

  const checkSymptoms =
    async () => {

      if (!symptoms.trim()) {

        alert(
          'Please describe your symptoms'
        );

        return;
      }


      setAiLoading(true);

      setSymptomResult(null);


      const localAssessment =
        classifySymptomsLocally(
          symptoms
        );


      try {

        // ====================================================
        // HEALTH INFO
        // ====================================================

        let govData = null;

        try {

          const healthResponse =
            await axios.post(

              'http://localhost:5000/api/health-info',

              {
                symptom:
                  symptoms
              },

              {
                timeout:
                  6000
              }

            );


          if (
            healthResponse.data?.success
          ) {

            govData =
              healthResponse
                .data.data;

          }

        } catch (healthError) {

          console.warn(
            'Government health API unavailable.'
          );

        }


        // ====================================================
        // AI ANALYSIS
        // ====================================================

        let result = {};

        try {

          const aiResponse =
            await axios.post(

              'http://localhost:5000/api/analyze-symptoms',

              {
                symptoms
              },

              {
                timeout:
                  8000
              }

            );


          result =
            aiResponse.data?.data ||
            {};

        } catch (aiError) {

          console.warn(
            'AI backend unavailable. Using local triage.'
          );

        }


        // ====================================================
        // SAFETY OVERRIDE
        // ====================================================

        if (
          localAssessment.severity ===
          'severe'
        ) {

          result.severity =
            'severe';

          result.emergency =
            true;


          result.remedies = [

            'Do not ignore these symptoms.',

            'Seek emergency medical attention immediately.'

          ];


          result.advice =
            `These symptoms may indicate a medical emergency. Call ${EMERGENCY_NUMBER} or go to the nearest emergency department immediately.`;

        }

        else if (

          localAssessment.severity ===
            'moderate' &&

          result.severity !==
            'severe'

        ) {

          result.severity =
            'moderate';

        }

        else if (
          !result.severity
        ) {

          result.severity =
            'mild';

        }


        result.govData =
          govData;

        result.symptom =
          symptoms;


        if (
          !result.remedies
        ) {

          result.remedies = [

            'Rest and stay hydrated.',

            'Monitor your symptoms.'

          ];

        }


        if (
          !result.advice
        ) {

          result.advice =
            'If your symptoms persist or worsen, consult a healthcare professional.';

        }


        setSymptomResult(
          result
        );


        // ====================================================
        // AUTOMATIC HOSPITAL SEARCH
        // ====================================================

        if (
          result.emergency ||
          result.severity ===
            'severe'
        ) {

          setShowHospitals(
            true
          );

          loadNearbyHospitals();

        }


      } catch (error) {

        console.error(
          'Symptom processing error:',
          error
        );


        setSymptomResult({

          severity:
            localAssessment.severity,

          emergency:
            localAssessment.emergency,

          remedies:

            localAssessment.severity ===
            'severe'

              ? [

                  'Do not ignore these symptoms.',

                  'Seek emergency medical attention immediately.'

                ]

              : [

                  'Rest and stay hydrated.',

                  'Monitor your symptoms.'

                ],

          advice:

            localAssessment.severity ===
            'severe'

              ? `Possible medical emergency. Call ${EMERGENCY_NUMBER} immediately.`

              : 'If symptoms persist or worsen, consult a healthcare professional.',

          symptom:
            symptoms,

          govData:
            null

        });


        if (
          localAssessment.emergency
        ) {

          setShowHospitals(
            true
          );

          loadNearbyHospitals();

        }

      }


      finally {

        setAiLoading(false);

      }

    };


// ============================================================
// HOSPITAL SEARCH
// ============================================================

  const loadNearbyHospitals =
    async () => {

      setLoadingHospitals(
        true
      );


      try {

        let lat = null;
        let lon = null;


        // ====================================================
        // 1. TRY SAVED ADDRESS
        // ====================================================

        const addressText =
          [

            user.address,

            user.city,

            'India'

          ]

            .filter(Boolean)

            .join(', ');


        if (addressText) {

          try {

            const geoResponse =
              await axios.get(

                'https://nominatim.openstreetmap.org/search',

                {

                  params: {

                    q:
                      addressText,

                    format:
                      'jsonv2',

                    limit:
                      1

                  },

                  headers: {

                    Accept:
                      'application/json'

                  },

                  timeout:
                    8000

                }

              );


            if (
              geoResponse.data?.length
            ) {

              lat =
                parseFloat(
                  geoResponse
                    .data[0].lat
                );

              lon =
                parseFloat(
                  geoResponse
                    .data[0].lon
                );

            }

          } catch (addressError) {

            console.warn(
              'Full address geocoding failed.'
            );

          }

        }


        // ====================================================
        // 2. TRY CITY ONLY
        // ====================================================

        if (
          lat === null ||
          lon === null
        ) {

          if (user.city) {

            try {

              const cityResponse =
                await axios.get(

                  'https://nominatim.openstreetmap.org/search',

                  {

                    params: {

                      q:
                        `${user.city}, India`,

                      format:
                        'jsonv2',

                      limit:
                        1

                    },

                    headers: {

                      Accept:
                        'application/json'

                    },

                    timeout:
                      8000

                  }

                );


              if (
                cityResponse.data?.length
              ) {

                lat =
                  parseFloat(
                    cityResponse
                      .data[0].lat
                  );

                lon =
                  parseFloat(
                    cityResponse
                      .data[0].lon
                  );

              }

            } catch (_) {

              console.warn(
                'City geocoding failed.'
              );

            }

          }

        }


        // ====================================================
        // 3. LAST FALLBACK: BROWSER LOCATION
        // ====================================================

        if (
          (lat === null ||
            lon === null) &&
          navigator.geolocation
        ) {

          try {

            const position =
              await new Promise(
                (resolve, reject) => {

                  navigator.geolocation.getCurrentPosition(

                    resolve,

                    reject,

                    {
                      enableHighAccuracy:
                        true,

                      timeout:
                        7000,

                      maximumAge:
                        300000

                    }

                  );

                }
              );


            lat =
              position.coords.latitude;

            lon =
              position.coords.longitude;

          } catch (_) {

            console.warn(
              'Browser location unavailable.'
            );

          }

        }


        // ====================================================
        // NO LOCATION
        // ====================================================

        if (
          lat === null ||
          lon === null
        ) {

          alert(

            'I could not locate your saved address. Please edit your Profile and enter a proper address + city.'

          );

          return;

        }


        // ====================================================
        // SEARCH 15 KM
        // ====================================================

        const overpassQuery = `

          [out:json][timeout:30];

          (

            nwr["amenity"="hospital"]
              (around:15000,${lat},${lon});

            nwr["amenity"="clinic"]
              (around:15000,${lat},${lon});

            nwr["healthcare"="hospital"]
              (around:15000,${lat},${lon});

            nwr["healthcare"="clinic"]
              (around:15000,${lat},${lon});

          );

          out center tags;

        `;


        const hospitalResponse =
          await axios.post(

            'https://overpass-api.de/api/interpreter',

            overpassQuery,

            {

              headers: {

                'Content-Type':
                  'text/plain'

              },

              timeout:
                30000

            }

          );


        const places =
          hospitalResponse.data
            ?.elements || [];


        const formatted =
          places

            .map(
              place => {

                const placeLat =
                  place.lat ??
                  place.center?.lat;

                const placeLon =
                  place.lon ??
                  place.center?.lon;


                if (
                  placeLat == null ||
                  placeLon == null
                ) {

                  return null;

                }


                const tags =
                  place.tags || {};


                const distance =
                  calculateDistance(

                    lat,

                    lon,

                    placeLat,

                    placeLon

                  );


                return {

                  id:
                    `${place.type}-${place.id}`,

                  name:

                    tags.name ||

                    tags['name:en'] ||

                    'Medical Facility',


                  address:

                    tags['addr:full'] ||

                    [

                      tags['addr:housenumber'],

                      tags['addr:street'],

                      tags['addr:suburb'],

                      tags['addr:city']

                    ]

                      .filter(Boolean)

                      .join(', ') ||

                    'Address unavailable',


                  phone:

                    tags.phone ||

                    tags['contact:phone'] ||

                    'Phone not available',


                  emergency:

                    tags.emergency ===
                    'yes'

                      ? 'Emergency facility'

                      : '',


                  rating:
                    'Not available',


                  type:

                    (
                      tags.amenity ===
                        'clinic' ||
                      tags.healthcare ===
                        'clinic'
                    )

                      ? 'Clinic'

                      : 'Hospital',


                  distance

                };

              }
            )

            .filter(Boolean)


            // Remove duplicates
            .filter(
              (item, index, arr) =>
                index ===
                arr.findIndex(
                  x =>
                    x.name
                      .toLowerCase() ===
                    item.name
                      .toLowerCase()
                )
            )


            .sort(
              (a, b) =>
                a.distance -
                b.distance
            );


        setNearbyHospitals(
          formatted
        );


        setShowHospitals(
          true
        );


        if (
          formatted.length ===
          0
        ) {

          alert(
            'No hospitals or clinics found within 15 km.'
          );

        }

      }


      catch (error) {

        console.error(
          'Hospital search failed:',
          error
        );


        alert(
          'Hospital search is temporarily unavailable. Please try again.'
        );

      }


      finally {

        setLoadingHospitals(
          false
        );

      }

    };


// ============================================================
// CLEAR RECORDS
// ============================================================

  const clearAllData = () => {

    if (
      window.confirm(
        'Clear uploaded documents and analysis results?'
      )
    ) {

      setDocuments([]);

      setResults(null);

      setUploaded(false);

      localStorage.removeItem(
        'trace_documents'
      );

      localStorage.removeItem(
        'trace_results'
      );

    }

  };


// ============================================================
// REMOVE DOCUMENT
// ============================================================

  const removeFile =
    (index) => {

      const newDocs =
        documents.filter(
          (_, i) =>
            i !== index
        );


      setDocuments(
        newDocs
      );


      if (
        newDocs.length ===
        0
      ) {

        setResults(null);

        setUploaded(false);

        localStorage.removeItem(
          'trace_results'
        );

      }

    };


// ============================================================
// EMOJI
// ============================================================

  const getSeverityEmoji =
    severity => {

      if (
        severity ===
        'severe'
      ) {
        return '🚨';
      }

      if (
        severity ===
        'moderate'
      ) {
        return '⚠️';
      }

      return '✅';

    };


// ============================================================
// LOGIN PAGE
// ============================================================

  if (!isLoggedIn) {

    return (

      <ThemeProvider
        theme={theme}
      >

        <CssBaseline />

        <Box

          sx={{

            minHeight:
              '100vh',

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            background:
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

            p: 2

          }}

        >

          <motion.div

            initial={{
              opacity: 0,
              y: 50
            }}

            animate={{
              opacity: 1,
              y: 0
            }}

            transition={{
              duration: 0.5
            }}

            style={{
              width: '100%',
              maxWidth: 450
            }}

          >

            <Paper
              sx={{
                p: 4
              }}
            >

              <Box
                sx={{
                  textAlign:
                    'center',
                  mb: 4
                }}
              >

                <MedicalServices

                  sx={{
                    fontSize: 48,
                    color:
                      '#7C3AED'
                  }}

                />


                <Typography

                  variant="h4"

                  sx={{

                    fontWeight:
                      700,

                    color:
                      '#7C3AED'

                  }}

                >

                  TRACE

                </Typography>


                <Typography
                  color="text.secondary"
                >

                  Your Health. Reconciled.

                </Typography>

              </Box>


              <Tabs

                value={
                  showLogin
                    ? 0
                    : 1
                }

                onChange={
                  (_, v) =>
                    setShowLogin(
                      v === 0
                    )
                }

                centered

                sx={{
                  mb: 3
                }}

              >

                <Tab
                  label="Login"
                />

                <Tab
                  label="Sign Up"
                />

              </Tabs>


              {showLogin ? (

                <Box>

                  <TextField

                    fullWidth

                    label="Email"

                    type="email"

                    value={
                      loginEmail
                    }

                    onChange={
                      e =>
                        setLoginEmail(
                          e.target.value
                        )
                    }

                    sx={{
                      mb: 2
                    }}

                    InputProps={{

                      startAdornment:

                        <InputAdornment
                          position="start"
                        >

                          <Email />

                        </InputAdornment>

                    }}

                  />


                  <TextField

                    fullWidth

                    label="Password"

                    type="password"

                    value={
                      loginPassword
                    }

                    onChange={
                      e =>
                        setLoginPassword(
                          e.target.value
                        )
                    }

                    sx={{
                      mb: 3
                    }}

                    InputProps={{

                      startAdornment:

                        <InputAdornment
                          position="start"
                        >

                          <Lock />

                        </InputAdornment>

                    }}

                  />


                  <Button

                    fullWidth

                    variant="contained"

                    size="large"

                    onClick={
                      handleLogin
                    }

                  >

                    Login

                  </Button>


                  <Typography

                    variant="caption"

                    color="text.secondary"

                    sx={{

                      display:
                        'block',

                      mt: 2,

                      textAlign:
                        'center'

                    }}

                  >

                    Demo: any email/password

                  </Typography>

                </Box>

              ) : (

                <Box>

                  <TextField

                    fullWidth

                    label="Full Name"

                    value={
                      signupName
                    }

                    onChange={
                      e =>
                        setSignupName(
                          e.target.value
                        )
                    }

                    sx={{
                      mb: 2
                    }}

                    InputProps={{

                      startAdornment:

                        <InputAdornment
                          position="start"
                        >

                          <Person />

                        </InputAdornment>

                    }}

                  />


                  <TextField

                    fullWidth

                    label="Email"

                    value={
                      signupEmail
                    }

                    onChange={
                      e =>
                        setSignupEmail(
                          e.target.value
                        )
                    }

                    sx={{
                      mb: 2
                    }}

                  />


                  <TextField

                    fullWidth

                    label="Password"

                    type="password"

                    value={
                      signupPassword
                    }

                    onChange={
                      e =>
                        setSignupPassword(
                          e.target.value
                        )
                    }

                    sx={{
                      mb: 2
                    }}

                  />


                  <TextField

                    fullWidth

                    label="Home Address"

                    value={
                      signupAddress
                    }

                    onChange={
                      e =>
                        setSignupAddress(
                          e.target.value
                        )
                    }

                    sx={{
                      mb: 2
                    }}

                  />


                  <TextField

                    fullWidth

                    label="City"

                    value={
                      signupCity
                    }

                    onChange={
                      e =>
                        setSignupCity(
                          e.target.value
                        )
                    }

                    sx={{
                      mb: 3
                    }}

                  />


                  <Button

                    fullWidth

                    variant="contained"

                    size="large"

                    onClick={
                      handleSignup
                    }

                  >

                    Create Account

                  </Button>

                </Box>

              )}

            </Paper>

          </motion.div>

        </Box>

      </ThemeProvider>

    );

  }


// ============================================================
// MAIN APP
// ============================================================

  return (

    <ThemeProvider
      theme={theme}
    >

      <CssBaseline />


      {/* HEADER */}

      <AppBar

        position="sticky"

        color="transparent"

        elevation={0}

        sx={{

          background:
            'rgba(255,255,255,0.97)',

          backdropFilter:
            'blur(10px)'

        }}

      >

        <Toolbar>

          <MedicalServices

            sx={{

              mr: 1.5,

              color:
                '#7C3AED'

            }}

          />


          <Typography

            variant="h5"

            sx={{

              fontWeight: 700,

              color:
                '#7C3AED'

            }}

          >

            TRACE

          </Typography>


          <Typography

            variant="subtitle2"

            sx={{

              ml: 1,

              color:
                '#6B7280'

            }}

          >

            Health Reconciliation

          </Typography>


          <Box
            sx={{
              flexGrow: 1
            }}
          />


          {/* PROFILE BUTTON */}

          <Button

            variant="outlined"

            startIcon={
              <AccountCircle />
            }

            onClick={
              openProfile
            }

            sx={{
              mr: 1
            }}

          >

            {user.name ||
              'Profile'}

          </Button>


          <Chip

            icon={
              <Security
                fontSize="small"
              />
            }

            label="HIPAA"

            size="small"

            color="success"

            sx={{
              mr: 1
            }}

          />


          <IconButton

            onClick={
              handleLogout
            }

            sx={{

              color:
                '#EF4444'

            }}

          >

            <Close />

          </IconButton>

        </Toolbar>

      </AppBar>


      {/* ======================================================
          PROFILE SUMMARY — ALWAYS VISIBLE
      ====================================================== */}

      <Box

        sx={{

          background:
            '#ffffff',

          borderBottom:
            '1px solid #E5E7EB'

        }}

      >

        <Container
          maxWidth="lg"
        >

          <Box

            sx={{

              py: 1.5,

              display:
                'flex',

              alignItems:
                'center',

              gap: 2,

              flexWrap:
                'wrap'

            }}

          >

            <Chip

              icon={
                <Person />
              }

              label={
                `Name: ${user.name || 'Not set'}`
              }

              variant="outlined"

            />


            <Chip

              icon={
                <Email />
              }

              label={
                user.email ||
                'Email not set'
              }

              variant="outlined"

            />


            <Chip

              icon={
                <LocationOn />
              }

              label={

                user.city

                  ? `City: ${user.city}`

                  : 'City not set'

              }

              variant="outlined"

            />


            <Button

              size="small"

              startIcon={
                <Edit />
              }

              onClick={
                openProfile
              }

            >

              Edit Profile

            </Button>

          </Box>

        </Container>

      </Box>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <Box

        sx={{

          minHeight:
            '100vh',

          background:
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

          py: 4

        }}

      >

        <Container
          maxWidth="lg"
        >


          {/* TABS */}

          <Paper
            sx={{
              mb: 4
            }}
          >

            <Tabs

              value={
                tabValue
              }

              onChange={
                (_, v) =>
                  setTabValue(v)
              }

              centered

            >

              <Tab
                label="📄 Health Records"
              />

              <Tab
                label="🩺 Symptom Checker"
              />

            </Tabs>

          </Paper>


          {/* ==================================================
              HEALTH RECORDS
          ================================================== */}

          {tabValue === 0 && (

            <motion.div

              initial={{
                opacity: 0
              }}

              animate={{
                opacity: 1
              }}

            >

              <Box

                sx={{

                  mb: 5,

                  textAlign:
                    'center'

                }}

              >

                <Typography

                  variant="h4"

                  sx={{
                    color:
                      'white'
                  }}

                >

                  Your Health Records.

                  <span
                    style={{
                      color:
                        '#FCD34D'
                    }}
                  >

                    {' '}
                    Reconciled.

                  </span>

                </Typography>


                <Typography

                  sx={{

                    color:
                      'rgba(255,255,255,0.85)',

                    mt: 1

                  }}

                >

                  Upload medical documents and analyze them for conflicts, missing evidence and outdated information.

                </Typography>

              </Box>


              <Paper

                sx={{

                  p: 4,

                  mb: 4

                }}

              >

                <Box

                  sx={{

                    display:
                      'flex',

                    flexDirection:
                      'column',

                    alignItems:
                      'center'

                  }}

                >

                  <FileUpload

                    sx={{

                      fontSize: 64,

                      color:
                        '#7C3AED',

                      mb: 2

                    }}

                  />


                  <Typography
                    variant="h6"
                  >

                    Upload Your Health Records

                  </Typography>


                  <Typography

                    variant="body2"

                    color="text.secondary"

                    sx={{
                      mb: 3
                    }}

                  >

                    PDFs, images, or text files

                  </Typography>


                  <Button

                    variant="contained"

                    component="label"

                    startIcon={
                      <CloudUpload />
                    }

                  >

                    Choose Files

                    <input

                      type="file"

                      hidden

                      multiple

                      accept=".pdf,.jpg,.jpeg,.png,.txt"

                      onChange={
                        handleUpload
                      }

                    />

                  </Button>


                  {documents.length >
                    0 && (

                    <Box

                      sx={{

                        mt: 3,

                        display:
                          'flex',

                        flexWrap:
                          'wrap',

                        justifyContent:
                          'center',

                        gap: 1

                      }}

                    >

                      {documents.map(
                        (doc, i) => (

                          <Chip

                            key={i}

                            label={
                              doc.name
                            }

                            icon={
                              <Description />
                            }

                            onDelete={() =>
                              removeFile(i)
                            }

                          />

                        )
                      )}


                      <Chip

                        label="Clear Records"

                        icon={
                          <DeleteSweep />
                        }

                        color="error"

                        onClick={
                          clearAllData
                        }

                      />

                    </Box>

                  )}

                </Box>

              </Paper>


              {processing && (

                <Slide

                  direction="up"

                  in

                >

                  <Paper
                    sx={{
                      p: 3,
                      mb: 3
                    }}
                  >

                    <Box

                      sx={{

                        display:
                          'flex',

                        gap: 2,

                        alignItems:
                          'center'

                      }}

                    >

                      <LinearProgress
                        sx={{
                          flex: 1
                        }}
                      />

                      <Typography>

                        Analyzing records...

                      </Typography>

                    </Box>

                  </Paper>

                </Slide>

              )}


              {results && (

                <Fade
                  in
                >

                  <Box>

                    <Grid

                      container

                      spacing={3}

                      sx={{
                        mb: 3
                      }}

                    >

                      <Grid item xs={6} md={2.4}>

                        <Card>

                          <CardContent
                            sx={{
                              textAlign:
                                'center'
                            }}
                          >

                            <CheckCircle
                              color="success"
                            />

                            <Typography
                              variant="h4"
                            >

                              {
                                results.summary
                                  ?.confirmed ??
                                0
                              }

                            </Typography>

                            <Typography>
                              Confirmed
                            </Typography>

                          </CardContent>

                        </Card>

                      </Grid>


                      <Grid item xs={6} md={2.4}>

                        <Card>

                          <CardContent
                            sx={{
                              textAlign:
                                'center'
                            }}
                          >

                            <Warning
                              color="warning"
                            />

                            <Typography
                              variant="h4"
                            >

                              {
                                results.summary
                                  ?.conflicts ??
                                0
                              }

                            </Typography>

                            <Typography>
                              Conflicts
                            </Typography>

                          </CardContent>

                        </Card>

                      </Grid>


                      <Grid item xs={6} md={2.4}>

                        <Card>

                          <CardContent
                            sx={{
                              textAlign:
                                'center'
                            }}
                          >

                            <ErrorIcon
                              color="error"
                            />

                            <Typography
                              variant="h4"
                            >

                              {
                                results.summary
                                  ?.missing ??
                                0
                              }

                            </Typography>

                            <Typography>
                              Missing
                            </Typography>

                          </CardContent>

                        </Card>

                      </Grid>


                      <Grid item xs={6} md={2.4}>

                        <Card>

                          <CardContent
                            sx={{
                              textAlign:
                                'center'
                            }}
                          >

                            <Schedule
                              color="warning"
                            />

                            <Typography
                              variant="h4"
                            >

                              {
                                results.summary
                                  ?.outdated ??
                                0
                              }

                            </Typography>

                            <Typography>
                              Outdated
                            </Typography>

                          </CardContent>

                        </Card>

                      </Grid>


                      <Grid item xs={6} md={2.4}>

                        <Card>

                          <CardContent
                            sx={{
                              textAlign:
                                'center'
                            }}
                          >

                            <Help
                              color="primary"
                            />

                            <Typography
                              variant="h4"
                            >

                              {
                                results.summary
                                  ?.unknown ??
                                0
                              }

                            </Typography>

                            <Typography>
                              Uncertain
                            </Typography>

                          </CardContent>

                        </Card>

                      </Grid>

                    </Grid>


                    <Card
                      sx={{
                        mt: 3
                      }}
                    >

                      <CardContent>

                        <Typography
                          variant="h6"
                          sx={{
                            mb: 2
                          }}
                        >

                          <Share />

                          {' '}

                          Doctor Handoff Summary

                        </Typography>


                        <Typography
                          color="text.secondary"
                        >

                          Share the reconciled summary with your healthcare provider.

                        </Typography>

                      </CardContent>

                    </Card>

                  </Box>

                </Fade>

              )}

            </motion.div>

          )}


          {/* ==================================================
              SYMPTOM CHECKER
          ================================================== */}

          {tabValue === 1 && (

            <motion.div

              initial={{
                opacity: 0
              }}

              animate={{
                opacity: 1
              }}

            >

              <Box

                sx={{

                  mb: 5,

                  textAlign:
                    'center'

                }}

              >

                <Typography

                  variant="h4"

                  sx={{
                    color:
                      'white'
                  }}

                >

                  🩺 Virtual Health Assistant

                </Typography>


                <Typography

                  sx={{

                    color:
                      'rgba(255,255,255,0.85)',

                    mt: 1

                  }}

                >

                  AI-assisted symptom triage with emergency red-flag detection.

                </Typography>

              </Box>


              <Paper
                sx={{
                  p: 4,
                  mb: 3
                }}
              >

                <TextField

                  fullWidth

                  multiline

                  rows={3}

                  label="Describe your symptoms"

                  placeholder="Example: chest pain, dizziness and sweating"

                  value={
                    symptoms
                  }

                  onChange={
                    e =>
                      setSymptoms(
                        e.target.value
                      )
                  }

                  sx={{
                    mb: 3
                  }}

                />


                <Box

                  sx={{

                    display:
                      'flex',

                    gap: 2,

                    flexWrap:
                      'wrap'

                  }}

                >

                  <Button

                    variant="contained"

                    size="large"

                    startIcon={
                      <Healing />
                    }

                    onClick={
                      checkSymptoms
                    }

                    disabled={
                      aiLoading
                    }

                  >

                    {aiLoading

                      ? 'Analyzing...'

                      : 'Check Symptoms'}

                  </Button>


                  <Button

                    variant="outlined"

                    size="large"

                    startIcon={
                      <LocalHospital />
                    }

                    onClick={
                      loadNearbyHospitals
                    }

                    disabled={
                      loadingHospitals
                    }

                  >

                    {loadingHospitals

                      ? 'Finding Hospitals...'

                      : 'Find Hospitals Near Me'}

                  </Button>

                </Box>

              </Paper>


              {/* RESULT */}

              {symptomResult && (

                <Fade
                  in
                >

                  <Box>


                    <Alert

                      severity={

                        symptomResult.severity ===
                        'severe'

                          ? 'error'

                          : symptomResult.severity ===
                            'moderate'

                          ? 'warning'

                          : 'success'

                      }

                      sx={{
                        mb: 3
                      }}

                    >

                      <Typography
                        variant="h6"
                      >

                        {
                          getSeverityEmoji(
                            symptomResult.severity
                          )
                        }

                        {' '}

                        Severity:

                        {' '}

                        {String(
                          symptomResult.severity
                        ).toUpperCase()}

                      </Typography>


                      <Typography>

                        {symptomResult.severity ===
                        'severe'

                          ? `🚨 POSSIBLE MEDICAL EMERGENCY — Call ${EMERGENCY_NUMBER} immediately.`

                          : symptomResult.severity ===
                            'moderate'

                          ? '⚠️ These symptoms need attention and should be monitored closely.'

                          : '✅ No emergency red flag was detected from the information provided.'}

                      </Typography>

                    </Alert>


                    {symptomResult
                      .severity ===
                      'severe' && (

                      <Button

                        fullWidth

                        variant="contained"

                        color="error"

                        size="large"

                        startIcon={
                          <Emergency />
                        }

                        sx={{
                          mb: 3
                        }}

                        onClick={() => {

                          window.location.href =
                            `tel:${EMERGENCY_NUMBER}`;

                        }}

                      >

                        🚨 CALL EMERGENCY SERVICES
                        {' '}
                        ({EMERGENCY_NUMBER})

                      </Button>

                    )}


                    <Paper

                      sx={{

                        p: 3,

                        mb: 3

                      }}

                    >

                      <Typography
                        variant="h6"
                      >

                        <Favorite />

                        {' '}

                        Home Remedies / General Care

                      </Typography>


                      <List>

                        {(symptomResult.remedies ||
                          [
                            'Rest and stay hydrated.',
                            'Monitor your symptoms.'
                          ]
                        ).map(
                          (remedy, i) => (

                            <ListItem
                              key={i}
                            >

                              <ListItemIcon>

                                <Science />

                              </ListItemIcon>

                              <ListItemText
                                primary={
                                  remedy
                                }
                              />

                            </ListItem>

                          )
                        )}

                      </List>

                    </Paper>


                    {symptomResult.advice && (

                      <Paper

                        sx={{

                          p: 3,

                          mb: 3,

                          bgcolor:
                            '#EFF6FF'

                        }}

                      >

                        <Typography

                          variant="h6"

                          sx={{
                            mb: 1
                          }}

                        >

                          <MedicalServices />

                          {' '}

                          Medical Advice

                        </Typography>


                        <Typography>

                          {
                            symptomResult.advice
                          }

                        </Typography>

                      </Paper>

                    )}

                  </Box>

                </Fade>

              )}


              {/* =================================================
                  HOSPITALS
              ================================================= */}

              {showHospitals && (

                <Box
                  sx={{
                    mt: 4
                  }}
                >

                  <Typography

                    variant="h5"

                    sx={{

                      color:
                        'white',

                      mb: 1

                    }}

                  >

                    🏥 Hospitals & Clinics Near You

                  </Typography>


                  <Typography

                    sx={{

                      color:
                        'rgba(255,255,255,0.85)',

                      mb: 3

                    }}

                  >

                    Location based on your saved profile address.

                    {user.address
                      ? ` ${user.address},`
                      : ''}

                    {user.city
                      ? ` ${user.city}.`
                      : ''}

                  </Typography>


                  {loadingHospitals && (

                    <Paper
                      sx={{
                        p: 3,
                        mb: 3
                      }}
                    >

                      <Box

                        sx={{

                          display:
                            'flex',

                          alignItems:
                            'center',

                          gap: 2

                        }}

                      >

                        <CircularProgress
                          size={24}
                        />


                        <Typography>

                          Searching within 15 km...

                        </Typography>

                      </Box>

                    </Paper>

                  )}


                  <Grid

                    container

                    spacing={3}

                  >

                    {nearbyHospitals.map(
                      hospital => (

                        <Grid

                          item

                          xs={12}

                          sm={6}

                          md={4}

                          key={
                            hospital.id
                          }

                        >

                          <Card

                            sx={{

                              height:
                                '100%'

                            }}

                          >

                            <CardContent>

                              <Box

                                sx={{

                                  display:
                                    'flex',

                                  justifyContent:
                                    'space-between',

                                  gap: 1

                                }}

                              >

                                <Typography
                                  variant="h6"
                                >

                                  {
                                    hospital.name
                                  }

                                </Typography>


                                <Chip

                                  label={
                                    hospital.type
                                  }

                                  size="small"

                                  color={

                                    hospital.type ===
                                    'Clinic'

                                      ? 'success'

                                      : 'primary'

                                  }

                                />

                              </Box>


                              <Divider
                                sx={{
                                  my: 1.5
                                }}
                              />


                              <Box

                                sx={{

                                  display:
                                    'flex',

                                  gap: 1,

                                  mb: 1

                                }}

                              >

                                <LocationOn
                                  fontSize="small"
                                />

                                <Typography
                                  variant="body2"
                                >

                                  {
                                    hospital.address
                                  }

                                </Typography>

                              </Box>


                              <Typography

                                variant="body2"

                                sx={{

                                  color:
                                    '#7C3AED',

                                  fontWeight:
                                    700,

                                  mb: 1.5

                                }}

                              >

                                📍

                                {' '}

                                {
                                  hospital.distance.toFixed(
                                    1
                                  )
                                }

                                {' '}

                                km away

                              </Typography>


                              <Box

                                sx={{

                                  display:
                                    'flex',

                                  gap: 1,

                                  mb: 1

                                }}

                              >

                                <Phone
                                  fontSize="small"
                                />

                                <Typography
                                  variant="body2"
                                >

                                  {
                                    hospital.phone
                                  }

                                </Typography>

                              </Box>


                              {hospital.emergency && (

                                <Box

                                  sx={{

                                    display:
                                      'flex',

                                    gap: 1,

                                    mb: 1

                                  }}

                                >

                                  <Emergency
                                    fontSize="small"
                                    color="error"
                                  />

                                  <Typography
                                    variant="body2"
                                  >

                                    {
                                      hospital.emergency
                                    }

                                  </Typography>

                                </Box>

                              )}


                              <Box

                                sx={{

                                  display:
                                    'flex',

                                  gap: 1

                                }}

                              >

                                <Star

                                  fontSize="small"

                                  color="warning"

                                />

                                <Typography
                                  variant="body2"
                                >

                                  Rating:

                                  {' '}

                                  {
                                    hospital.rating
                                  }

                                </Typography>

                              </Box>

                            </CardContent>

                          </Card>

                        </Grid>

                      )
                    )}

                  </Grid>


                  {!loadingHospitals &&

                    nearbyHospitals.length ===
                      0 && (

                      <Paper

                        sx={{
                          p: 3
                        }}

                      >

                        <Typography>

                          No nearby hospitals are currently displayed.

                          Edit your profile to make sure your
                          address and city are correct, then try again.

                        </Typography>

                      </Paper>

                    )}

                </Box>

              )}

            </motion.div>

          )}

        </Container>

      </Box>


      {/* ======================================================
          PROFILE DIALOG
      ====================================================== */}

      <Dialog

        open={
          profileOpen
        }

        onClose={() =>
          setProfileOpen(false)
        }

        fullWidth

        maxWidth="sm"

      >

        <DialogTitle>

          <Box

            sx={{

              display:
                'flex',

              alignItems:
                'center',

              gap: 1

            }}

          >

            <AccountCircle
              color="primary"
            />

            My Profile

          </Box>

        </DialogTitle>


        <DialogContent>

          <Typography

            variant="body2"

            color="text.secondary"

            sx={{
              mb: 3
            }}

          >

            These details are used to identify your profile and find hospitals near your saved address.

          </Typography>


          <TextField

            fullWidth

            label="Full Name"

            value={
              profileForm.name
            }

            disabled={
              !editingProfile
            }

            onChange={
              e =>
                setProfileForm({

                  ...profileForm,

                  name:
                    e.target.value

                })
            }

            sx={{
              mb: 2
            }}

          />


          <TextField

            fullWidth

            label="Email"

            value={
              profileForm.email
            }

            disabled={
              !editingProfile
            }

            onChange={
              e =>
                setProfileForm({

                  ...profileForm,

                  email:
                    e.target.value

                })
            }

            sx={{
              mb: 2
            }}

          />


          <TextField

            fullWidth

            label="Home Address"

            value={
              profileForm.address
            }

            disabled={
              !editingProfile
            }

            onChange={
              e =>
                setProfileForm({

                  ...profileForm,

                  address:
                    e.target.value

                })
            }

            sx={{
              mb: 2
            }}

          />


          <TextField

            fullWidth

            label="City"

            value={
              profileForm.city
            }

            disabled={
              !editingProfile
            }

            onChange={
              e =>
                setProfileForm({

                  ...profileForm,

                  city:
                    e.target.value

                })
            }

          />

        </DialogContent>


        <DialogActions>

          <Button

            onClick={() =>
              setProfileOpen(false)
            }

          >

            Close

          </Button>


          {!editingProfile ? (

            <Button

              variant="contained"

              startIcon={
                <Edit />
              }

              onClick={() =>
                setEditingProfile(
                  true
                )
              }

            >

              Edit Profile

            </Button>

          ) : (

            <Button

              variant="contained"

              startIcon={
                <Save />
              }

              onClick={
                saveProfile
              }

            >

              Save Profile

            </Button>

          )}

        </DialogActions>

      </Dialog>

    </ThemeProvider>

  );
}

export default App;