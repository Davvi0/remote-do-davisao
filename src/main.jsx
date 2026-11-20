import React from 'react';
import { createRoot } from 'react-dom/client';
import Connect from './screens/Connect';
import Remote from './screens/Remote';
import {useRemote} from './hooks/useRemote';
import './styles.css';
import './polish.css';
import './mobile.css';
function App(){const remote=useRemote();return <main className="shell">{remote.device?<Remote remote={remote}/>:<Connect remote={remote}/>}</main>}
createRoot(document.getElementById('root')).render(<App/>);
if('serviceWorker' in navigator&&import.meta.env.PROD&&window.isSecureContext){
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(registration=>registration.update()).catch(()=>{});
}
