import React, { useEffect, useState } from 'react';
import '../styles/Result.css';
import { Link, useNavigate } from 'react-router-dom';
import ResultTable from './ResultTable';
import { useDispatch, useSelector } from 'react-redux';
import { postServerData } from '../helper/helper';
import api from '../axios/axios';

import { resetAllAction } from '../redux/question_reducer';
import { resetResultAction } from '../redux/result_reducer';

export default function Result() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [resultSubmitted, setResultSubmitted] = useState(false);

    const { 
        questions: { queue = [], answers = [] },
        result: { result = [], username = '', email = '', regNo = '', department = '', departmentId = '' }
    } = useSelector(state => state);

    // Calculate total questions and correct answers
    const totalQuestions = queue.length;
    const correctAnswers = result.reduce((score, answer, index) => {
        if (answer !== undefined && answers[index] !== undefined) {
            const isCorrect = Number(answer) === Number(answers[index]);
            return score + (isCorrect ? 1 : 0);
        }
        return score;
    }, 0);

    const actualAttempts = result.filter(ans => ans !== undefined).length;

    useEffect(() => {
        const publishResult = async () => {
            try {
                if(result.length && queue.length && username && email && !resultSubmitted) {
                    const resultData = {
                        username,
                        email,
                        regNo,
                        dept: department,
                        points: correctAnswers,
                        attempts: actualAttempts,
                        totalQuestions,
                        result: result
                    };

                    // Store result first
                    const response = await postServerData(
                        `/api/result`, 
                        resultData
                    );

                    // Clear active session after result is stored
                    await api.post('/api/users/clear-session', {
                        email,
                        regNo
                    });

                    setResultSubmitted(true);
                    navigate('/feedback');
                }
            } catch (error) {
                console.error("Error publishing result:", error);
            }
        };

        publishResult();
    }, []);

    function onRestart() {
        dispatch(resetAllAction());
        dispatch(resetResultAction());
    }

    return (
        <div className='container'>
            <h1 className='title text-light'>Quiz Results</h1>

            <div className='result flex-center'>
                <div className='flex'>
                    <span>Username</span>
                    <span className='bold'>{username}</span>
                </div>
                <div className='flex'>
                    <span>Registration Number</span>
                    <span className='bold'>{regNo}</span>
                </div>
                <div className='flex'>
                    <span>Department</span>
                    <span className='bold'>{department}</span>
                </div>
                <div className='flex'>
                    <span>Total Questions : </span>
                    <span className='bold'>{totalQuestions}</span>
                </div>
                <div className='flex'>
                    <span>Questions Attempted : </span>
                    <span className='bold'>{actualAttempts}</span>
                </div>
                <div className='flex'>
                    <span>Correct Answers : </span>
                    <span className='bold'>{correctAnswers}</span>
                </div>
            </div>

            <div className="start">
                <Link className='btn' to={'/'} onClick={onRestart}>Finish</Link>
            </div>

            <div className="container">
                <ResultTable />
            </div>
        </div>
    );
}