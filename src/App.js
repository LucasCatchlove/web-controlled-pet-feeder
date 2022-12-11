//eslint-disable
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, child, get } from "firebase/database";
import { useState, useEffect } from "react";
import "./App.css"

const firebaseConfig = {
  apiKey: "AIzaSyBC1jxmcPnRllB9z6iuGsl6M417SgW0uCM",
  projectId: "petfeeder-17c6c",
  databaseURL: "https://petfeeder-17c6c-default-rtdb.firebaseio.com/"
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
              <div>Food container level: <b>{feederState.food_container_level}</b></div>
              <div>{feederState.space_in_bowl ? "bowl is almost empty " : "bowl is full"}</div>
            </>
            : "loading..."}
        </div>
        <div className="Controls Card">
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

          <button className="FeedButton" onClick={feed}>feed pet</button>

        </div>

        <button className="LogoutButton" onClick={handleLogout}>log out</button>
      </div>}
    </div>
  );
}

export default App;
