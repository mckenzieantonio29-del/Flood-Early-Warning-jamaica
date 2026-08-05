// data.js
// 4 borehole locations from the WRA flood report along with AWS locations and Shelter locations provided from the ODPEM site

const BOREHOLES = [
  {
    id: 'content',
    name: 'Content Borehole',
    type: 'borehole',
    lat: 18.078212,
    lng: -77.465578,
    // Latest daily reading available as of the WRA Website (May 22, 2026)
    latestReading: {
      date: '2026-05-22',
      gwl_m: 83.095,
      cond_mS: 0.436,
      temp_C: 24.28
    },
    status: 'green', 
    notes: 'Site of the diver installation and the hand-read flood gauge (in meters). Closest borehole to the flooding.'
  },
  {
    id: 'Hope',
    name: 'Hope Village Borehole',
    type: 'borehole',
    lat: 18.064874,
    lng: -77.440064,
    latestReading: {
      date: '2023-06-20',
      gwl_m: 17.617
    },
    status: 'green',
    notes: 'Second closest borehole location to content in the karst aquifer system monitored for this study. However readings for this site have not been logged since june 2023'
  },
  {
    id: 'melrose-hill',
    name: 'Melrose Hill Borehole',
    type: 'borehole',
    lat: 18.051740,
    lng: -77.438422,
    latestReading: {
      date: '2025-11-05',
      gwl_m: 52.66,
      cond_mS: 0.5,
      temp_C: 23.91
    },
    status: 'green',
    notes: 'Third diver location in the karst aquifer system monitored for this study.'
  },
  {
    id: 'russell-place',
    name: 'Russell Place Borehole',
    type: 'borehole',
    lat: 18.063755,
    lng: -77.476586,
    latestReading: {
      date: '2026-05-22',
      gwl_m: 48.707,
      cond_mS: 0.484,
      temp_C: 23.80
    },
    status: 'green',
    notes: 'Diver installed slightly later than the other two sites (Nov 7, 2025 vs Nov 5). Last two days in the source data have no reading for this site, so the date above is Feb 2, not Feb 4.'
  }
];

//Total inches here are from the WRA report but I opted to not show them on the site in favor of the live readings instead
const RAINFALL_POINTS = [
 { name: 'Devon Pri', lat: 18.166768, lng: -77.532460, total_in: 16.70 },
  { name: 'Cross Keys', lat: 17.898289, lng: -77.502724, total_in: 16.66 },
  { name: 'Marshall Pen Sutton', lat: 18.050533, lng: -77.531551, total_in: 18.94 },
  { name: 'Ingleside', lat: 18.056205, lng: -77.500044, total_in: 25.47 },
  { name: 'Kendal', lat: 18.075454, lng: -77.494118, total_in: 7.07 },
  { name: 'May Pen', lat: 17.9645, lng: -77.2452, total_in: 11.10 }
];

const SHELTERS = [
  {id: 'bellefield_hs', name: 'Bellefield High School', lat: 18.079995, lng: -77.452973},
  {id: 'mile-gully_cs', name: 'Mile Gully Community Centre', lat: 18.135535, lng: -77.543937},
  {id: 'kendal_infscl', name: 'Kendal Primary & Infant School', lat: 18.073821, lng: -77.493174},
  {id: 'grace_apc', name: 'Grace Apostolic Church', lat: 18.067110, lng: -77.516125},
  {id: 'porus_hs', name: 'Porus High School', lat: 18.037032, lng: -77.409089},
  {id: 'porus_inf', name: 'Porus Infant School', lat: 18.035296, lng: -77.404724},
  {id: 'mandeville_p', name: 'Mandeville Primary & Junior High School', lat: 18.040356, lng: -77.509718},
  {id: 'manchester_hs', name: 'Manchester High School', lat: 18.036143, lng: -77.510448},
  {id: 'mayday_hs', name: 'May Day High School', lat: 18.008738, lng: -77.489003}
]
