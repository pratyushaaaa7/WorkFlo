// //FOR DEVELOPMENT PHASE
import axios from "axios";
import { logoutUser } from "../lib/logoutHelper";
import Toast from "react-native-toast-message";

// const api = axios.create({
//   baseURL: "http://192.168.1.103:5000/api", // Change localhost if testing on physical device
//   // baseURL: "http://localhost:5000/api"
// });

const api = axios.create({
  baseURL: "https://api.wprojects.in/api",
});

// const api = axios.create({
//   baseURL: 'https://wtechbackend.onrender.com/api',  // Live backend URL
// });

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const message = error.response?.data?.message;

    // TOKEN EXPIRED → 401
    if (status === 401) {
      setTimeout(() => {
        Toast.show({
          type: "error",
          text1: "Session expired",
          text2: "Please login again",
          position: "bottom",
        });
      }, 800); // ⬅️ Delay toast by 0.8 sec
      console.log("⛔ Global logout triggered (401 Token expired)");
      logoutUser(); // Clears auth + handles routing
    }

    // ACCOUNT DEACTIVATED → 403
    if (status === 403 && code === "ACCOUNT_DEACTIVATED") {
      setTimeout(() => {
        Toast.show({
          type: "error",
          text1: "Account deactivated",
          text2: message || "Please contact admin",
          position: "bottom",
        });
      }, 800); // ⬅️ Delay toast by 0.8 sec

      console.log("⛔ Global logout triggered (403 Account deactivated)");
      logoutUser();
    }
    return Promise.reject(error);
  },
);
export default api;

//FINAL DEPLOYED OUR OWN BACKEND CODE FOR PRODUCTION PHASE!!!!!!!!!!!!!!
// import axios from "axios";
// import { logoutUser } from "../lib/logoutHelper";
// import Toast from "react-native-toast-message";

// const api = axios.create({
//   baseURL: "https://api.wprojects.in/api",
// });

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const status = error.response?.status;
//     const message = error.response?.data?.message;

//     // TOKEN EXPIRED → 401
//     if (status === 401) {
//       setTimeout(() => {
//         Toast.show({
//           type: "error",
//           text1: "Session expired",
//           text2: "Please login again",
//           position: "bottom",
//         });
//       }, 800); // ⬅️ Delay toast by 0.8 sec
//       console.log("⛔ Global logout triggered (401 Token expired)");
//       logoutUser(); // Clears auth + handles routing
//     }

//     // ACCOUNT DEACTIVATED → 403
//     if (status === 403) {
//       setTimeout(() => {
//         Toast.show({
//           type: "error",
//           text1: "Account deactivated",
//           text2: message || "Please contact admin",
//           position: "bottom",
//         });
//       }, 800); // ⬅️ Delay toast by 0.8 sec

//       console.log("⛔ Global logout triggered (403 Account deactivated)");
//       logoutUser();
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

//--------------------------------------------------------------------
//--------------------------------------------------------------------
//--------------------------------------------------------------------

// import axios from 'axios';
// const api = axios.create({
//   baseURL: 'https://wtechbackend.onrender.com/api',  // Live backend URL
// });
// export default api;

// import axios from "axios";
// const api = axios.create({
//   baseURL: "http://103.109.6.123:5000/api", // Replace <VPS_IP> with your VPS public IP
//   // OR
//   // baseURL: "https://yourdomain.com/api", // if you have a domain + HTTPS set up
// });
// export default api;

// import axios from "axios";
// const api = axios.create({
//   baseURL: "http://103.109.6.123/api",  // Production API through Nginx
// });
// export default api;
