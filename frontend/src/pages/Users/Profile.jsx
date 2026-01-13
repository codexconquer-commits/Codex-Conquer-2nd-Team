// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import Toastify from 'toastify-js';
// import 'toastify-js/src/toastify.css';

// const BASE = import.meta.env.VITE_BASE_URL;

// const Profile = () => {
//   const [data, setData] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) {
//           Toastify({
//             text: "You need to login first!",
//             duration: 3000,
//             gravity: "top",
//             position: "right",
//             style: {
//               background: "red",
//               color: "#fff",
//               borderRadius: "8px",
//               fontWeight: "bold",
//             },
//           }).showToast();

//           navigate('/login');
//           return;
//         }

//         const result = await axios.get(
//           `${BASE}/api/users/me`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}` // 🔥 important
//             },
//             withCredentials: true
//           }
//         );

//         console.log(result.data.user.email);
//         setData(result.data.user);
//       } catch (error) {
//         console.error("Error fetching profile:", error);

//         Toastify({
//           text: "Failed to load profile!",
//           duration: 3000,
//           gravity: "top",
//           position: "right",
//           style: {
//             background: "red",
//             color: "#fff",
//             borderRadius: "8px",
//             fontWeight: "bold",
//           },
//         }).showToast();
//       }
//     };

//     fetchData();
//   }, [navigate]);

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold">User Profile</h1>

//       {data ? (
//         <>
//           <p><strong>Name:</strong> {data.name}</p>
//           <p><strong>Email:</strong> {data.email}</p>
//         </>
//       ) : (
//         <p>Loading...</p>
//       )}
//     </div>
//   );
// };

// export default Profile;
