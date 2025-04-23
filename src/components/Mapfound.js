import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Polygon, Marker, InfoWindow, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api';
import axios from 'axios';

const kkuBoundaryCoordinates = [
  { lat: 16.482067, lng: 102.832368 }, { lat: 16.480803, lng: 102.805970 },
  { lat: 16.442559, lng: 102.810207 }, { lat: 16.441244, lng: 102.819292 },
  { lat: 16.465277, lng: 102.822122 }, { lat: 16.464163, lng: 102.831683 },
  { lat: 16.482067, lng: 102.832368 }
];

const Mapfound = ({ timePeriod }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['visualization'],
  });
  console.log("Google Maps API Key:", process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  // ดึงข้อมูลทั้งหมดหรือ 5 อันดับแรกตาม timePeriod
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://localhost:5001/blogs/top-object-location?timePeriod=${timePeriod}`);
        if (response.data && response.data.topLocations) {
          setBlogs(response.data.topLocations.slice(0, 5)); // หรือใช้ locations ทั้งหมดตามเงื่อนไขที่กำหนด
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [timePeriod]);


  // ดึงข้อมูล Heatmap โดยใช้ timePeriod
  useEffect(() => {
    const fetchAllLocationsForHeatmap = async () => {
      try {
        const response = await axios.get(`https://hahai-admin-79ly.onrender.com/blogs?timePeriod=${timePeriod}`);
        if (response.data && response.data.blogs && response.data.blogs.length > 0) {
          setHeatmapData(response.data.blogs.map(loc => ({
            location: new window.google.maps.LatLng(loc.latitude, loc.longitude),
            weight: loc.count,
          })));

          if (mapRef.current) {
            const bounds = new window.google.maps.LatLngBounds();
            response.data.blogs.forEach(loc => {
              bounds.extend(new window.google.maps.LatLng(loc.latitude, loc.longitude));
            });
            mapRef.current.fitBounds(bounds);
          }
        } else {
          setHeatmapData([]); // ถ้าไม่มีข้อมูลให้ reset heatmapData
        }
      } catch (error) {
        console.error('Error fetching all locations for heatmap:', error);
      }
    };

    if (timePeriod) {
      fetchAllLocationsForHeatmap();
    }
  }, [timePeriod]);

  const rankingEmojis = ["1.", "2.", "3.", "4.", "5."];

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100vh' }}
      onLoad={map => (mapRef.current = map)}
    >
      <Polygon
        paths={kkuBoundaryCoordinates}
        options={{
          fillColor: '#FFC107',
          fillOpacity: 0.2,
          strokeColor: '#FF9800',
          strokeOpacity: 0.8,
          strokeWeight: 2,
        }}
      />

      <HeatmapLayer
        data={heatmapData}
        options={{
          radius: 20,
          opacity: 0.6
        }}
      />

      {/* แสดง markers สำหรับ blogs */}
      {blogs.map((blog, index) => (
        <Marker
          key={index}
          position={{ lat: blog.latitude, lng: blog.longitude }}
          title={blog.locationname}
          onClick={() => setSelectedBlog({ ...blog, rank: index + 1 })}
        />
      ))}


      {selectedBlog && (
        <InfoWindow
          position={{ lat: selectedBlog.latitude, lng: selectedBlog.longitude }}
          onCloseClick={() => setSelectedBlog(null)}
        >
          <div>
            <h6>
              {rankingEmojis[selectedBlog.rank - 1] || "?"} {selectedBlog.locationname} ({selectedBlog.count} ครั้ง)
            </h6>
            <button
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/locationdetail/${selectedBlog.locationname}`)}
            >
              ดูกระทู้ทั้งหมด
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default Mapfound;
