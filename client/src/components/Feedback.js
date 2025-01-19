import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../axios/axios'

const StarRating = ({ rating, setRating, question }) => {
    return (
        <div className="star-rating">
            <p>{question}</p>
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <span
                        key={index}
                        className={`star ${starValue <= rating ? 'selected' : ''}`}
                        onClick={() => setRating(starValue)}
                    >
                        ★
                    </span>
                );
            })}
        </div>
    );
};

export default function Feedback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { 
        result: { result, username, email, regNo, department, departmentId }
    } = useSelector(state => state);

    useEffect(() => {
        sessionStorage.setItem('testTaken', true);
    }, []);

    const [feedbackData, setFeedbackData] = useState({
        q1: 0,
        q2: 0,
        q3: 0,
        comments: ''
    });

    const questions = {
        q1: "How would you rate the difficulty level of the questions?",
        q2: "How would you rate the clarity of the questions?",
        q3: "How would you rate your overall experience?"
    };

    const terminationType = searchParams.get('t');
    const { title, message } = getTerminationMessage(terminationType);

    const handleFeedbackSubmit = async () => {
        try {
            if (feedbackData.q1 === 0 || feedbackData.q2 === 0 || feedbackData.q3 === 0) {
                setError('Please rate all questions');
                return;
            }

            if (!feedbackData.comments.trim()) {
                setError('Please provide your comments');
                return;
            }

            setIsLoading(true);

            await api.post('/api/feedback', {
                ratings: {
                    q1: feedbackData.q1,
                    q2: feedbackData.q2,
                    q3: feedbackData.q3
                },
                comments: feedbackData.comments.trim()
            });

            navigate('/success', { replace: true });

        } catch (error) {
            setError(error.response?.data?.message || 'Error submitting feedback');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className='container'>
            <h2 className='title text-light'>Loading...</h2>
        </div>;
    }

    return (
        <div className='container'>
            <h2 className='title text-light'>Test Completed</h2>
            <p className='text-light' style={{ 
                marginBottom: '2rem',
                textAlign: 'center',
                fontSize: '1.1rem',
                color: 'black',
                fontWeight: 'bold'
            }}>{message}</p>
            
            <div className="feedback-section">
                {error && <div className="error-msg">{error}</div>}
                
                {Object.entries(questions).map(([key, question]) => (
                    <StarRating
                        key={key}
                        rating={feedbackData[key]}
                        setRating={(value) => setFeedbackData({...feedbackData, [key]: value})}
                        question={question}
                    />
                ))}

                <div className="comment-section">
                    <textarea
                        placeholder="Please share your additional comments..."
                        value={feedbackData.comments}
                        onChange={(e) => setFeedbackData({...feedbackData, comments: e.target.value})}
                        required
                        className="feedback-textarea"
                        style={{ width: '500px' }}
                    />
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginTop: '1rem' 
                }}>
                    <button 
                        onClick={handleFeedbackSubmit}
                        className="btn"
                        style={{ width: '500px' }}
                    >
                        Submit Feedback & Finish
                    </button>
                </div>
            </div>
        </div>
    );
}

function getTerminationMessage(terminationType) {
    switch(terminationType) {
        case 'tabswitch':
            return {
                title: 'Test Terminated',
                message: 'Your test has been terminated due to switching tabs twice. This is considered a violation of test rules.'
            };
        case 'timeout':
            return {
                title: 'Time\'s Up!',
                message: 'Your test has been submitted as the allocated time has ended.'
            };
        case 'completed':
            return {
                title: 'Test Completed!',
                message: 'You have successfully completed your test.'
            };
        default:
            return {
                title: 'Test Submitted',
                message: 'Your test has been submitted.'
            };
    }
}
