import './App.scss';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { v4 as uuid } from "uuid";
import { arrayUnion, getFirestore, doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { collection, query, where, getDoc, updateDoc, getDocs, Timestamp } from "firebase/firestore";
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
import { db, auth } from "./firebase";



function App() {


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
  const [currentChat, setCurrent] = useState();
  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);

  useEffect(() => {
    const getChats = () => {
      const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
        setChats(doc.data())
      });
      return () => {
        unsub();
      };
    };

    currentUser.uid && getChats();

  }, [currentUser.uid]);
  //console.log(Object.entries(chats));

  const handleSelect = (u) => {
    console.log(u.uid);
    console.log(currentChat);
    if (currentChat != u.uid) {
      setCurrent(u.uid);
      dispatch({ type: "CHANGE_USER", payload: u });
    } else {
      setCurrent(null);
      dispatch({ type: "NO_USER", payload: null });
    }
  }

  return (
    <div className='usersList'>
      <ul>
        {chats != null ? Object.entries(chats)?.map((chat) => (
          <li>
            <div key={chat[0]} onClick={() => handleSelect(chat[1].userInfo)}>
              <span>{chat[1].userInfo.displayName}</span>
            </div>
          </li>
        )) : <div>{console.log("error in select")}</div>}
      </ul>
    </div>
  );
}

function SearchUsers() {
  const { currentUser } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState("");
  const [user, setUser] = useState(null);
  const [err, setErr] = useState(false);

  const handleSearch = async () => {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("displayName", "==", displayName));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {

      setUser(doc.data());
    });
  }

  const handleKey = (e) => {
    e.code === "Enter" && handleSearch();

  }

  const handleSelect = async () => {
    const combUid = auth.currentUser.uid > user.uid ? auth.currentUser.uid + user.uid : user.uid + auth.currentUser.uid;
    console.log(combUid);
    console.log(currentUser.userName);
    const res = await getDoc(doc(db, "chats", combUid));
    console.log("just before if statement");
    if (!res.exists()) {
      console.log("Inside if statement");
      console.log(auth.currentUser.uid);
      console.log(auth.currentUser.displayName);
      await setDoc(doc(db, "chats", combUid), { messages: [] });
      await updateDoc(doc(db, "userChats", user.uid),
        {
          [combUid + ".userInfo"]: {
            uid: auth.currentUser.uid,
            displayName: auth.currentUser.displayName
          },
          [combUid + ".date"]: serverTimestamp()
        });

      await updateDoc(doc(db, "userChats", auth.currentUser.uid),
        {
          [combUid + ".userInfo"]: {
            uid: user.uid,
            displayName: user.displayName
          },
          [combUid + ".date"]: serverTimestamp()
        });
    }
  };
  return (
    <div className="searchForm">
      <input type="text" placeholder='Find A User' onKeyDown={handleKey} onChange={e => setDisplayName(e.target.value)}></input>
      {user && <div className="userChat" onClick={handleSelect}>
        <div className='chatInfo'>
          <span>{user.displayName}</span>
        </div>
      </div>}
    </div>
  );
}

function ChatRoom() {
  const { currentUser } = useContext(AuthContext);
  //console.log("made it to chatroom");
  const dummy = useRef();
  //const messagesRef = firestore.collection('messages');
  // const query = messagesRef.orderBy('createdAt').limit(25);
  // const [messages] = useCollectionData(query, { idField: 'id' });
  //let isConnected = messages == null ? 'true' : 'false';

  const logUser = async () => {
    if (currentUser.isNewUser) {
      await setDoc(doc(db, "userChats", currentUser.uid), {});

    }
  }

  // const sendMessage = async (e) => {
  //   e.preventDefault();
  //   const { uid } = auth.currentUser;

  //   await messagesRef.add({
  //     text: formValue,
  //     createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  //     uid
  //   })
  //   setFormValue('');

  //   dummy.current.scrollIntoView({ behavior: 'smooth' });
  // }

  logUser();

  const { data } = useContext(ChatContext);

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [sHeight, setSHeight] = useState();

  const handleSend = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "chats", data.chatId), {
      messages: arrayUnion({
        id: uuid(),
        text,
        senderId: currentUser.uid,
        date: Timestamp.now()
      }),
    });
    dummy.current.scrollIntoView({ behavior: 'smooth' });
    setText("");
  }

  const handleScroll = async () => {
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  const handleLoad = async () => {
    console.log("text");
    //await dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    if (data.chatId != 'null') {
      const unSub = onSnapshot(doc(db, "chats", data.chatId), (doc) => {
        console.log(data);
        doc.exists() && setMessages(doc.data().messages);
      });

      return () => {
        unSub();
      };
    } else {
      setMessages(null);
    }
  }, [data.chatId]);

  return (
    <div className="chatroomContainer">
      <div className="userContainer">
        <SearchUsers />
        <Chats />
      </div>
      <div className="chatContainer">
        <div className='stickler'>
          <div className='nameContainer'>
            <h4>{data.user?.displayName}</h4>
          </div>
        </div>
        <div className="messages">
          {messages ? messages.map(msg => <ChatMessage key={msg.uuid} message={msg} />) : <h1>Please Select a user</h1>}
          <button className='posFixed' type='button' onClick={handleScroll} style={{display: messages ? 'inline' : 'none'}}  >
            V
          </button>
          <div ref={dummy}></div>
        </div>
        {
          messages ?
            <div className='stickler'>
              <div className='messageInput'>
                <form onSubmit={handleSend}>
                  <input value={text} onChange={(e) => setText(e.target.value)} />
                  <button type='submit'>
                    enter
                  </button>
                </form>
              </div>
            </div>
            : <div></div>}
      </div >
    </div >
  );
}

function ChatMessage(props) {
  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);
  const { text, uid, senderId } = props.message;
  const messageClass = senderId === currentUser.uid ? 'sent' : 'received';
  //let isConnected = text == null ? 'true' : 'false';
  return (
    <div className={`message ${messageClass}`}>
      <p>{text}</p>
    </div>
  )
}

export default App;
