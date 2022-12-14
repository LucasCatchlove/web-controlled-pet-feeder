//eslint-disable
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, child, get, serverTimestamp } from "firebase/database";
import { useState, useEffect } from "react";
import "./App.css"

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_URL
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);

function App() {
  const [loggedIn, setLoginStatus] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [feederState, setFeederState] = useState(null);
  const [feedingQuantity, setFeedingQuantity] = useState(0);
  const [feedingInterval, setFeedingInterval] = useState(0);


  const handleLogin = () => {
    get(child(ref(db), "feeder_state/auth")).then(res => {
      if (res.exists()) {
        if (res.val().username === username && res.val().password === password) {
          setLoginStatus(true);
        }
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  const handleLogout = () => {
    setLoginStatus(false);
    setUsername("");
    setPassword("");
  }

  const handleQuantityUpdate = (e) => {
    setFeedingQuantity(e.target.value)
    set(ref(db, 'feeder_state/feed_quantity'), parseInt(feedingQuantity));
  }

  const feed = (quantity) => {
    set(ref(db, 'feeder_state/feed'), parseInt(feedingQuantity));
  }

  useEffect(() => {
    const r = ref(db, 'feeder_state');
    onValue(r, (snapshot) => {
      const data = snapshot.val();
      setFeederState(data);
    });
  }, [])

  return (
    <div className="container">
      <center>
        <h1>Pet Feeder 1.0 🐶</h1>
      </center>


      {!loggedIn ?
        <center>
          <div className="LoginForm">
            <input placeholder="username" value={username}
              onChange={(e) => setUsername(e.target.value)} />
            <br /><br />
            <input placeholder="password" type="password"
              onChange={(e) => setPassword(e.target.value)} />
            <br /><br />
            <button onClick={handleLogin} className="LoginButton">Login</button>
          </div>
        </center>

        :

        <div className="App">
          <div className="DeviceStatus Card">
            <h2>Device Status</h2>
            {feederState ?
              <>
                <div>{feederState.connected ? "connected ✅" : "not connected  🛑"}</div>
                <div>Food container level: {feederState.food_container_level >= 17 ? "food container is almost empy!" : `${Math.floor(20-feederState.food_container_level)} cm`}</div>
                <div>{feederState.food_in_bowl_grams < 40 ?
                 `Bowl is almost empty! ${feederState.food_in_bowl_grams < 0 ? Math.ceil(feederState.food_in_bowl_grams) : Math.floor(feederState.food_in_bowl_grams)}g currently in bowl`
                  : `bowl has food in it. ${Math.floor(feederState.food_in_bowl_grams)}g currently in bowl`}</div>
              </>
              : "loading..."}
          </div>
          <div className="Feeding Controls Card">
            <h2>Controls</h2>
            <div>
              <input type="radio" id="sm-portion" name="portion" value={1} onChange={handleQuantityUpdate} />
              <label for="sm">small portion</label>
            </div>
            <div>
              <input type="radio" id="md-portion" name="portion" value={2} onChange={handleQuantityUpdate} />
              <label for="md">medium portion</label>
            </div>

            <div>
              <input type="radio" id="lg-portion" name="portion" value={3} onChange={handleQuantityUpdate} />
              <label for="lg">large portion</label>
            </div>

            <div>


              every <input type="number" class="ScheduleFeedInterval" onChange={e => setFeedingInterval(e.target.value)} /> hours
              starting at <input type="time" class="ScheduleStartTime" />


            </div>

            <button className="FeedButton" onClick={feed}>feed pet</button>

          </div>

          <button className="LogoutButton" onClick={handleLogout}>log out</button>
        </div>}
    </div>
  );
}

export default App;
