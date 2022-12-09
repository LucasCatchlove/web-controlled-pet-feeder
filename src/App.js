//eslint-disable
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { useState, useEffect } from "react";


const firebaseConfig = {
  apiKey: "AIzaSyBC1jxmcPnRllB9z6iuGsl6M417SgW0uCM",
  projectId: "petfeeder-17c6c",
  databaseURL: "https://petfeeder-17c6c-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);

function writeData() {
  const db = getDatabase();
  set(ref(db, 'test/'), {
  int: 666
  });
}

function App() {
  const [name , setName] = useState();
  const [age , setAge] = useState();
  const [state , setState] = useState(0);
  

  const Push = () => {

    set(ref(db, 'test/'), {
    int: 666,
    float: 555.0,
    blah: "tooo"

    });
  }

  useEffect(() => {
   
  const r = ref(db, 'test/int');
  onValue(r, (snapshot) => {
    const data = snapshot.val();
    console.log(data)
    setState(data);
  });
  }, [state])
  


  
  return (

    <div className="App">
      <center>
      <input placeholder="Enter your name" value={name} 
      onChange={(e) => setName(e.target.value)}/>
      <br/><br/>
      <input placeholder="Enter your age" value={age} 
      onChange={(e) => setAge(e.target.value)}/>
      <br/><br/> 
      <button onClick={Push}>PUSH</button>
      </center>
      <p>int: {state}</p>
    
    </div>
  );
}

export default App;
