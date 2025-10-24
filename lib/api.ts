//FOR DEVELOPMENT PHASE
import axios from "axios";
const api = axios.create({
  baseURL: "http://192.168.1.8:5000/api", // Change localhost if testing on physical device
});
export default api;


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



//FINAL DEPLOYED OUR OWN BACKEND CODE FOR PRODUCTION PHASE!!!!!!!!!!!!!!

// import axios from "axios";

// const api = axios.create({
//   baseURL: "https://api.wprojects.in/api",  // Production API through Nginx + HTTPS
// });

// export default api;






