// import React, { useContext } from 'react';
// import { Container, Row, Col, Card, Button } from 'react-bootstrap';
// import { Link } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext';
//
// const HomePage = () => {
//     const { user } = useContext(AuthContext);
//
//     return (
//         <div style={{ background: '#fff', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
//             <style>{`
//                 @keyframes animatedGradient {
//                     0% { background-position: 0% 50%; }
//                     50% { background-position: 100% 50%; }
//                     100% { background-position: 0% 50%; }
//                 }
//             `}</style>
//             <div style={{
//                 // Animated gradient background fills the whole screen under the navbar
//                 background: 'linear-gradient(270deg, #232526, #414345, #232526, #1a2980, #232526)',
//                 backgroundSize: '600% 600%',
//                 animation: 'animatedGradient 12s ease-in-out infinite',
//                 borderRadius: 0,
//                 boxShadow: 'none',
//                 padding: 0,
//                 position: 'fixed',
//                 top: '56px', // adjust to match your navbar height
//                 left: 0,
//                 width: '100vw',
//                 height: 'calc(100vh - 56px)', // full viewport minus navbar
//                 zIndex: 1,
//                 display: 'flex',
//                 flexDirection: 'column',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 transition: 'all 0.3s',
//             }}>
//                 {!user && (
//                     <div style={{ position: 'absolute', top: 36, right: 48, display: 'flex', gap: 20 }}>
//                         <Link to="/login">
//                             <Button variant="outline-light" style={{ borderRadius: 20, padding: '10px 36px', fontWeight: 600, fontSize: '1.15rem' }}>Log In</Button>
//                         </Link>
//                         <Link to="/register">
//                             <Button variant="light" style={{ borderRadius: 20, padding: '10px 36px', fontWeight: 600, fontSize: '1.15rem' }}>Register</Button>
//                         </Link>
//                     </div>
//                 )}
//                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
//                     <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '3.5rem', textAlign: 'center', marginBottom: 0, letterSpacing: '-1px', lineHeight: 1.1 }}>
//                         The best event<br />for you
//                     </h1>
//                 </div>
//             </div>
//         </div>
//     );
// };
//
// export default HomePage;

import React, { useContext } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const HomePage = () => {
    const { user } = useContext(AuthContext);

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
            <div style={{
                // Background image from the public directory
                backgroundImage: 'url("/cdf58fae-040e-46ca-9022-90ea9355cbc0.jpeg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'fixed',
                top: '56px', // adjust to match your navbar height
                left: 0,
                width: '100vw',
                height: 'calc(100vh - 56px)', // full viewport minus navbar
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 1s ease-in-out',
                // Add a dark overlay to improve text visibility if needed
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Adjust opacity as needed
                    zIndex: -1,
                }
            }}>
                {!user && (
                    <div style={{ position: 'absolute', top: 36, right: 48, display: 'flex', gap: 20 }}>
                        <Link to="/login">
                            <Button variant="outline-light" style={{ borderRadius: 20, padding: '10px 36px', fontWeight: 600, fontSize: '1.15rem' }}>Log In</Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="light" style={{ borderRadius: 20, padding: '10px 36px', fontWeight: 600, fontSize: '1.15rem' }}>Register</Button>
                        </Link>
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative', zIndex: 2 }}>
                    <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '3.5rem', textAlign: 'center', marginBottom: 0, letterSpacing: '-1px', lineHeight: 1.1, textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
                        The best event<br />for you
                    </h1>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
