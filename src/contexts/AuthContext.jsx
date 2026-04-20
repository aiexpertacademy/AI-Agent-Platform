import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'
import { api } from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

// Save/update user profile in MongoDB via the API
async function syncUserWithMongo(user) {
  try {
    await api.syncUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
    })
  } catch (err) {
    // Non-fatal — log and continue
    console.warn('Failed to sync user profile:', err.message)
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading]         = useState(true)

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider)
  }

  function logout() {
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await syncUserWithMongo(user)
      }
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = { currentUser, signup, login, loginWithGoogle, logout, loading }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
