import './App.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { v4 as uuid } from "uuid";
import { arrayUnion, getFirestore, doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { collection, query, where, getDoc, updateDoc, getDocs } from "firebase/firestore";
import React, { useState, useRef, useEffect, useContext } from "react";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AuthContext } from "./context/AuthContext";
import { ChatContext } from "./context/chatContext";

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import './firebase';

const firebaseConfig = firebase.initializeApp({
  apiKey: "AIzaSyAw83er0zUuA8ojuGAHxdVFrzO7EhM39kc",
  authDomain: "react-chat-app-cf837.firebaseapp.com",
  projectId: "react-chat-app-cf837",
  storageBucket: "react-chat-app-cf837.appspot.com",
  messagingSenderId: "546548669925",
  appId: "1:546548669925:web:98fe1500f32ccfb3d9230c",
  measurementId: "G-77EPKSWWJV"
});

const auth = firebase.auth();
const firestore = firebase.firestore();
const db = getFirestore(firebaseConfig);

function App() {

  const [user] = useAuthState(auth);

  const { currentUser } = useContext(AuthContext);

  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    return children
  };

  return (
    // <div className="App">
    //   <header>
    //     <SignOut />
    //   </header>
    //   <section>
    //     {user ? <ChatRoom /> : <SignIn />}
    //   </section>
    // </div>

    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route
            index
            element={
              <ProtectedRoute>
                <div className="App">
                  <header>
                    <SignOut />
                  </header>
                  <section>
                    <ChatRoom />
                  </section>
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


function ManLogin() {
  const [err, setErr] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setErr(true);
    }
  };
  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="title">Login</span>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="email" />
          <input type="password" placeholder="password" />
          <button>Sign in</button>
          {err && <span>Something went wrong</span>}
        </form>

      </div>
    </div>
  );
};



function SignIn() {

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithRedirect(provider);
  }


  return (
    <div>
      <ManLogin />
      <button onClick={signInWithGoogle}>Sign In With Google</button>
    </div>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <button onClick={() => auth.signOut()}>Sign Out</button>
    )
  );
}

function Chats() {

  const [chats, setChats] = useState([]);
  const { currentUser } = useContext(AuthContext);
  //const {dispatch} = useContext(ChatContext);

  useEffect(() => {
    const getChats = () => {
      const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
        setChats(doc.data())
      });
      return () => {
        unsub();
      };
    };

    currentUser.uid && getChats()

  }, [currentUser.uid]);
  //console.log(Object.entries(chats));

  const handleSelect = (u) => {
    //dispatch({type:"CHANGE_USER", payload:u})
  }

  return (
    <div>
      {Object.entries(chats)?.map((chat) => (
        <div key={chat[0]} onClick={() => handleSelect(chat[1].userInfo)}>
          <h1>{chat[1].userInfo.userName}</h1>
        </div>
      ))}
      <div>
        <h1>john</h1>
      </div>
      <div>
        <h1>janet</h1>
      </div>
    </div>
  );
}

function SearchUsers() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [err, setErr] = useState(false);

  const handleSearch = async () => {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("userName", "==", username));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {

      setUser(doc.data());
    });
  }

  const handleKey = e => {
    e.code === "Enter" && handleSearch();

  }

  const handleSelect = async () => {
    const combUid = auth.currentUser.uid > user.uid ? auth.currentUser.uid + user.uid : user.uid + auth.currentUser.uid;
    console.log(combUid);
    const res = await getDoc(doc(db, "chats", combUid));
    if (!res.exists()) {
      await setDoc(doc(db, "chats", combUid), { messages: [] });
      await updateDoc(doc(db, "userChats", auth.currentUser.uid),
        {
          [combUid + ".userInfo"]: {
            uid: auth.currentUser.uid,
            userName: auth.currentUser.userName
          },
          [combUid + ".date"]: serverTimestamp()
        });

      await updateDoc(doc(db, "userChats", user.uid),
        {
          [combUid + ".userInfo"]: {
            uid: user.uid,
            userName: user.userName
          },
          [combUid + ".date"]: serverTimestamp()
        });
    }
  }
  return (
    <div className="searchForm">
      <input type="text" placeholder='Find A User' onKeyDown={handleKey} onChange={e => setUsername(e.target.value)}></input>
      {user && <div className="userChat" onClick={handleSelect}>
        <div className='chatInfo'>
          <span>{user?.userName}</span>
        </div>
      </div>}
    </div>
  );
}

function ChatRoom() {
  const { currentUser } = useContext(AuthContext);
  //console.log("made it to chatroom");
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  // const query = messagesRef.orderBy('createdAt').limit(25);
  // const [messages] = useCollectionData(query, { idField: 'id' });
  let isConnected = messages == null ? 'true' : 'false';

  const [formValue, setFormValue] = useState('');

  const logUser = async () => {
    if (currentUser.isNewUser) {
      console.log("Logged a new User");
      await setDoc(doc(db, "userChats", currentUser.uid), {});

    }
  }
  
  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid
    })
    setFormValue('');

    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  logUser();

  const { data } = useContext(ChatContext);

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const handleSend = async() =>{
    await updateDoc(doc(db, "chats", data.chatId), {
      messages: arrayUnion({
        id: uuid(),
        text,
        senderId: currentUser.uid,
        date: firebase.firestore.FieldValue.serverTimestamp(),
      }),
    });
  }

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", data.chatId), (doc) => {
      doc.exists() && setMessages(doc.data().messages);
    });

    return () => {
      unSub();
    };
  }, [data.chatId]);

  console.log(messages)

  return (
    <div className="chatroomContainer">
      <div className="userContainer">
        <SearchUsers />
        <Chats />
      </div>
      <div className="chatContainer">
        <div className="messages">
          {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
          <div ref={dummy}></div>
        </div>
        <div className='messageInput'>
          <form onSubmit={sendMessage}>
            <input value={formValue} onChange={(e) => setFormValue(e.target.value)} />
            <button type="submit">
              enter
            </button>
          </form>
        </div>
      </div >
    </div>
  );
}

function ChatMessage(props) {
  const { text, uid } = props.message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  let isConnected = text == null ? 'true' : 'false';
  console.log(text)
  return (
    <div className={`message ${messageClass}`}>
      <p>{text}</p>
    </div>
  )
}

export default App;
