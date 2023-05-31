import '../firebase';
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import firebase from 'firebase/compat/app';
import { signInWithEmailAndPassword, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
    const [err, setErr] = useState(false);
    const navigate = useNavigate();

    const signInWithGoogle = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        signInWithRedirect(auth, provider);
    };

    const checkForRedirect= async () =>{
        console.log("passed");
        const result = await getRedirectResult(auth);
        return(result);
        // if (result) {
        //     navigate("/");
        // }
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        const password = e.target[1].value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/")
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
                <section>
                    {checkForRedirect ? navigate("/") : navigate("/login")}
                </section>
                <button onClick={signInWithGoogle}>Sign In With Google</button>
                <p>You don't have an account? <Link to="/register">Register</Link></p>
            </div>
        </div>
    );
};

export default Login;