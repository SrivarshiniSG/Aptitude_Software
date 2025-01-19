import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Success() {
    const navigate = useNavigate();

    useEffect(() => {
        // Prevent back navigation
        const preventNavigation = (e) => {
            e.preventDefault();
            alert("You have completed the test. You cannot go back.");
            window.history.pushState(null, null, window.location.pathname);
        };

        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', preventNavigation);

        // Prevent refresh/closing
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "You have completed the test. You cannot refresh or leave this page.";
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', preventNavigation);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleExit = () => {
        // Remove event listeners before navigating
        window.removeEventListener('beforeunload', () => {});
        window.removeEventListener('popstate', () => {});
        
        // Navigate directly without confirmation
        navigate('/', { replace: true });
    };

    return (
        <div className='container'>
            <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                maxWidth: '600px',
                margin: '0 auto'
            }}>
                <h2 className='title text-light'>Successfully Completed!</h2>
                <div style={{
                    backgroundColor: '#1eb2a6',
                    borderRadius: '8px',
                    padding: '20px',
                    marginTop: '20px'
                }}>
                    <p style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>
                        Thank you for completing the test and providing your feedback.
                    </p>
                    <button 
                        onClick={handleExit}
                        style={{
                            backgroundColor: 'white',
                            color: '#1eb2a6',
                            border: 'none',
                            padding: '12px 30px',
                            borderRadius: '5px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#f8f9fa';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        Exit Test
                    </button>
                </div>
            </div>
        </div>
    );
}

