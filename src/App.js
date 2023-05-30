import './App.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { collection, query, where, getDoc, updateDoc, getDocs } from "firebase/firestore";
import React, { useState, useRef } from "react";


import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';


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

  return (
    <div className="App">
      <header>
        <SignOut />
      </header>
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}



function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithRedirect(provider);
  }

  return (
    <div>
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
      await updateDoc(doc(db,"userChats",auth.currentUser.uid),
      {
        [combUid+".userInfo"]:{
          uid:auth.currentUser.uid,
          userName:auth.currentUser.displayName
        },
        [combUid+".date"]: serverTimestamp()
      });

      await updateDoc(doc(db,"userChats",user.uid),
      {
        [combUid+".userInfo"]:{
          uid:user.uid,
          userName:user.displayName
        },
        [combUid+".date"]: serverTimestamp()
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
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(25);
  const [messages] = useCollectionData(query, { idField: 'id' });
  let isConnected = messages == null ? 'true' : 'false';

  const [formValue, setFormValue] = useState('');

  const logUser = async () => {
    const { uid } = auth.currentUser;

    await setDoc(doc(db, "userChats", uid), {});
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

  return (
    <div className="chatroomContainer">
      <div className="userContainer">
        <SearchUsers />
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

  return (
    <div className={`message ${messageClass}`}>
      <p>{text}</p>
    </div>
  )
}

export default App;
