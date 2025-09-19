// import axios from 'axios';

// const api = axios.create({
//   baseURL: 'https://wtechbackend.onrender.com/api',  // Live backend URL
// });

// export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.105:5000/api',  // Change localhost if testing on physical device
});

export default api;


