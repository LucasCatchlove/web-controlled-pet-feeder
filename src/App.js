import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, child, get } from "firebase/database";
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

//main app
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
    set(ref(db, 'feeder_state/feed_level'), feedingLevelfromQuantity(parseInt(e.target.value)));
  }

  const feed = () => {
    set(ref(db, 'feeder_state/feed'), parseInt(feedingQuantity));
  }

  useEffect(() => {
    const r = ref(db, 'feeder_state');
    onValue(r, (snapshot) => {
      const data = snapshot.val();
      setFeederState(data);
    });
  }, [])

  const scheduleFeedings = () => {
    set(ref(db, 'feeder_state/feeding_quantity'), parseInt(feedingQuantity));
    set(ref(db, 'feeder_state/scheduling/active'), true);
    set(ref(db, 'feeder_state/scheduling/feeding_interval_hours'), parseFloat(feedingInterval));

    /*uncomment for normal operation
    set(ref(db, 'feeder_state/scheduling/feeding_interval_millis'), parseInt(feedingInterval*3600*1000));*/

    //demo purposes only --> spoofs hours as minutes
    set(ref(db, 'feeder_state/scheduling/feeding_interval_millis'), parseInt(feedingInterval * 60 * 1000));
  }

  const deleteSchedule = () => {
    set(ref(db, 'feeder_state/scheduling/active'), false);
  }

  const feedingLevelfromQuantity = quantity => {
      switch(quantity) {
        case 1: return "small"
        case 2: return "medium"
        case 3: return "large"
        default: 
      } 
  }

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
                <div>Food container level: <b>{feederState.food_container_level >= 17 ? `food container is almost empty! 🚨 ${Math.floor(20 - feederState.food_container_level)} cm ` : `${Math.floor(20 - feederState.food_container_level)} cm`}</b></div>
                <div><b>{feederState.food_in_bowl_grams < 40 ?
                  `Bowl is almost empty! 🚨  ${feederState.food_in_bowl_grams < 0 ? 0 : Math.floor(feederState.food_in_bowl_grams)}g currently in bowl`
                  : `bowl has food in it 🍲 ${Math.floor(feederState.food_in_bowl_grams)}g currently in bowl`}</b></div>
                  {feederState.scheduling.active ? <p>✅ feedings scheduled for every <b>{feederState.scheduling.feeding_interval_hours} hours </b></p>
                : <p>🛑 no scheduled feeds</p>
                }
                <div>feeding quantity set to <b>{feederState.feed_level}</b></div>
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
              feed every <input type="number" class="ScheduleFeedInterval" onChange={e => setFeedingInterval(e.target.value)} /> hours
            </div>
            <div className="ControlButtons">
              <button className="ControlButton" onClick={scheduleFeedings}>schedule feeding time</button>
              <button className="ControlButton" onClick={deleteSchedule}>remove schedule</button>
              <button className="ControlButton" onClick={feed}>feed pet</button>
            </div>


          </div>

          <button className="LogoutButton" onClick={handleLogout}>log out</button>
        </div>
      }
    </div>
  );
}

export default App;
