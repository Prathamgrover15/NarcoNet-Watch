import { useState } from "react";
import LoginScreen from "./loginscreen";
import Dashboard from "./dashboard";
// THIS is the file that "connects" the two pages.
// It holds ONE piece of state: loggedIn (true or false).
// - While loggedIn is false  -> show <LoginScreen />
// - Once loggedIn becomes true -> show <Dashboard /> instead
//
// LoginScreen doesn't need to know Dashboard exists at all.
// It just calls the onEnter function we hand it, whenever it's ready.
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? (
    <Dashboard />
  ) : (
    <LoginScreen onEnter={() => setLoggedIn(true)} />
  );
}